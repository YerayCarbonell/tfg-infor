const express = require("express");
const router = express.Router();
const Message = require("../models/Mensaje");
const User = require("../models/User");
const Oferta = require("../models/Oferta");
const auth = require("../middlewares/auth");

// Enviar mensaje
router.post("/mensajes", auth, async (req, res) => {
  try {
    const { receiver, content, oferta } = req.body;
    const sender = req.user.id;

    if (!receiver || !content) {
      return res.status(400).json({ msg: "Receptor y contenido son obligatorios" });
    }

    // Crear mensaje con oferta opcional
    const messageData = { 
      sender, 
      receiver, 
      content 
    };
    
    // Si se proporciona ID de oferta, agregarla al mensaje
    if (oferta) {
      // Verificar que la oferta existe
      const ofertaExiste = await Oferta.findById(oferta);
      if (!ofertaExiste) {
        return res.status(404).json({ msg: "La oferta especificada no existe" });
      }
      messageData.oferta = oferta;
    }

    const message = new Message(messageData);
    await message.save();

    res.status(201).json(message);
  } catch (error) {
    console.error("Error enviando mensaje:", error);
    res.status(500).json({ msg: "Error enviando mensaje", error: error.message });
  }
});

// Obtener mensajes de una conversación
router.get("/mensajes/:userId", auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUser = req.user.id;

    // Verificar que el usuario existe
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUser, receiver: userId },
        { sender: userId, receiver: currentUser }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Error obteniendo mensajes:", error);
    res.status(500).json({ msg: "Error obteniendo mensajes", error: error.message });
  }
});

// Obtener todas las conversaciones de un usuario
router.get("/conversaciones", auth, async (req, res) => {
  try {
    const currentUser = req.user.id;
    
    // Buscar todos los mensajes del usuario
    const mensajes = await Message.find({
      $or: [
        { sender: currentUser },
        { receiver: currentUser }
      ]
    }).sort({ createdAt: -1 }).populate("oferta", "titulo");
    
    // Extraer IDs únicos de los otros usuarios
    const userIds = new Set();
    mensajes.forEach(mensaje => {
      if (mensaje.sender.toString() !== currentUser) {
        userIds.add(mensaje.sender.toString());
      }
      if (mensaje.receiver.toString() !== currentUser) {
        userIds.add(mensaje.receiver.toString());
      }
    });
    
    const conversaciones = [];
    
    for (const userId of userIds) {
      // Obtener datos del usuario
      const user = await User.findById(userId).select("name");
      if (!user) continue; // Saltarse si el usuario ya no existe
      
      // Encontrar el último mensaje de la conversación
      const ultimoMensaje = mensajes.find(m => 
        m.sender.toString() === userId || m.receiver.toString() === userId
      );
      
      if (!ultimoMensaje) continue; // Si no hay mensajes, saltar
      
      // Contar mensajes no leídos
      const noLeidos = mensajes.filter(m => 
        m.sender.toString() === userId && 
        m.receiver.toString() === currentUser && 
        !m.read
      ).length;
      
      // Buscar la oferta asociada a la conversación (si existe)
      let ofertaTitulo = null;
      let ofertaId = null;
      
      // Buscar en los mensajes de esta conversación si alguno tiene una oferta
      const mensajesConversacion = mensajes.filter(m => 
        (m.sender.toString() === userId && m.receiver.toString() === currentUser) ||
        (m.sender.toString() === currentUser && m.receiver.toString() === userId)
      );
      
      // Buscar el primer mensaje que tenga una oferta
      const mensajeConOferta = mensajesConversacion.find(m => m.oferta);
      
      if (mensajeConOferta && mensajeConOferta.oferta) {
        ofertaId = mensajeConOferta.oferta._id;
        ofertaTitulo = mensajeConOferta.oferta.titulo;
      }
      
      conversaciones.push({
        userId,
        userName: user.name,
        ultimoMensaje: ultimoMensaje.content,
        fecha: ultimoMensaje.createdAt,
        noLeidos,
        ofertaTitulo,
        ofertaId
      });
    }
    
    // Ordenar por la fecha del último mensaje
    conversaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    res.json(conversaciones);
  } catch (error) {
    console.error("Error obteniendo conversaciones:", error);
    res.status(500).json({ msg: "Error obteniendo conversaciones", error: error.message });
  }
});

// Marcar mensajes como leídos
router.put("/mensajes/leer/:userId", auth, async (req, res) => {
  try {
    const senderId = req.params.userId;
    const currentUser = req.user.id;
    
    // Verificar que el usuario existe
    const userExists = await User.findById(senderId);
    if (!userExists) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }
    
    // Actualizar todos los mensajes no leídos de este remitente
    const result = await Message.updateMany(
      { 
        sender: senderId, 
        receiver: currentUser,
        read: false
      },
      { read: true }
    );
    
    res.json({ 
      msg: "Mensajes marcados como leídos", 
      updated: result.nModified || result.modifiedCount || 0 
    });
  } catch (error) {
    console.error("Error al marcar mensajes como leídos:", error);
    res.status(500).json({ msg: "Error al marcar mensajes como leídos", error: error.message });
  }
});

// Obtener mensajes relacionados con una oferta específica
router.get("/mensajes/oferta/:ofertaId", auth, async (req, res) => {
  try {
    const ofertaId = req.params.ofertaId;
    const currentUser = req.user.id;
    
    // Verificar que la oferta existe
    const oferta = await Oferta.findById(ofertaId);
    if (!oferta) {
      return res.status(404).json({ msg: "Oferta no encontrada" });
    }
    
    // Verificar que el usuario tiene permiso para ver estos mensajes
    // (es el organizador o un músico que ha postulado)
    const tienePermiso = 
      oferta.organizer.toString() === currentUser ||
      oferta.postulaciones.some(p => p.musician.toString() === currentUser);
      
    if (!tienePermiso) {
      return res.status(403).json({ msg: "No tienes permiso para ver estos mensajes" });
    }
    
    // Obtener mensajes relacionados con esta oferta
    const messages = await Message.find({
      oferta: ofertaId,
      $or: [
        { sender: currentUser },
        { receiver: currentUser }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'name')
    .populate('receiver', 'name');
    
    res.json(messages);
  } catch (error) {
    console.error("Error obteniendo mensajes de la oferta:", error);
    res.status(500).json({ msg: "Error obteniendo mensajes", error: error.message });
  }
});

// Iniciar una conversación sobre una oferta
router.post("/iniciar-conversacion", auth, async (req, res) => {
  try {
    const { receiverId, ofertaId, contenido } = req.body;
    const senderId = req.user.id;
    
    if (!receiverId || !ofertaId || !contenido) {
      return res.status(400).json({ 
        msg: "Se requiere ID del receptor, ID de la oferta y contenido del mensaje" 
      });
    }
    
    // Verificar que la oferta existe
    const oferta = await Oferta.findById(ofertaId);
    if (!oferta) {
      return res.status(404).json({ msg: "Oferta no encontrada" });
    }
    
    // Verificar que el receptor existe
    const receptor = await User.findById(receiverId);
    if (!receptor) {
      return res.status(404).json({ msg: "Usuario receptor no encontrado" });
    }
    
    // Crear mensaje
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content: contenido,
      oferta: ofertaId
    });
    
    await message.save();
    
    res.status(201).json({ 
      msg: "Conversación iniciada correctamente", 
      mensaje: message 
    });
  } catch (error) {
    console.error("Error al iniciar conversación:", error);
    res.status(500).json({ msg: "Error al iniciar conversación", error: error.message });
  }
});

// Eliminar una conversación completa
router.delete("/conversacion/:userId", auth, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUser = req.user.id;
    
    // Eliminar todos los mensajes entre ambos usuarios
    const result = await Message.deleteMany({
      $or: [
        { sender: currentUser, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUser }
      ]
    });
    
    res.json({ 
      msg: "Conversación eliminada", 
      deleted: result.deletedCount || 0 
    });
  } catch (error) {
    console.error("Error al eliminar conversación:", error);
    res.status(500).json({ msg: "Error al eliminar la conversación", error: error.message });
  }
});

module.exports = router;