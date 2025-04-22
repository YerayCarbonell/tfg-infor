const express = require("express");
const Rating = require("../models/Rating");
const Oferta = require("../models/Oferta");
const User = require("../models/User");
const authMiddleware = require("../middlewares/auth");

const router = express.Router();

// Crear una nueva valoración
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { ofertaId, evaluadoId, calificacion, comentario } = req.body;
    const evaluadorId = req.user.id;
    
    // Verificar que la oferta existe
    const oferta = await Oferta.findById(ofertaId);
    if (!oferta) {
      return res.status(404).json({ msg: "Oferta no encontrada" });
    }
    
    // Verificar que el evaluado existe
    const evaluado = await User.findById(evaluadoId);
    if (!evaluado) {
      return res.status(404).json({ msg: "Usuario a evaluar no encontrado" });
    }
    
    // Obtener el evaluador
    const evaluador = await User.findById(evaluadorId);
    
    // Determinar el tipo de valoración
    let tipo;
    
    if (evaluador.role === 'musician' && evaluado.role === 'organizer') {
      // Verificar que el músico participó en la oferta
      const participoEnOferta = oferta.postulaciones.some(
        p => p.musician.toString() === evaluadorId && p.estado === 'ACEPTADA'
      );
      
      if (!participoEnOferta) {
        return res.status(403).json({ msg: "Solo los músicos que participaron en este evento pueden valorar al organizador" });
      }
      tipo = 'musico-a-organizador';
    } else if (evaluador.role === 'organizer' && evaluado.role === 'musician') {
      // Verificar que el organizador creó la oferta
      if (oferta.organizer.toString() !== evaluadorId) {
        return res.status(403).json({ msg: "Solo el organizador del evento puede valorar a los músicos" });
      }
      
      // Verificar que el músico participó en la oferta
      const participoEnOferta = oferta.postulaciones.some(
        p => p.musician.toString() === evaluadoId && p.estado === 'ACEPTADA'
      );
      
      if (!participoEnOferta) {
        return res.status(403).json({ msg: "Solo puedes valorar a músicos que participaron en tu evento" });
      }
      tipo = 'organizador-a-musico';
    } else {
      return res.status(400).json({ msg: "Combinación de roles inválida para valoración" });
    }
    
    // Verificar si ya existe una valoración de este evaluador al evaluado para esta oferta
    const valoracionExistente = await Rating.findOne({ 
      oferta: ofertaId, 
      evaluador: evaluadorId,
      evaluado: evaluadoId 
    });
    
    if (valoracionExistente) {
      return res.status(400).json({ msg: "Ya has valorado a este usuario para este evento" });
    }
    
    // Crear la valoración
    const nuevaValoracion = new Rating({
      oferta: ofertaId,
      evaluador: evaluadorId,
      evaluado: evaluadoId,
      calificacion,
      comentario,
      tipo
    });
    
    await nuevaValoracion.save();
    
    // Si es una valoración del organizador a un músico, actualizar la calificación en la postulación
    if (tipo === 'organizador-a-musico') {
      const postulacionIndex = oferta.postulaciones.findIndex(
        p => p.musician.toString() === evaluadoId
      );
      
      if (postulacionIndex !== -1) {
        oferta.postulaciones[postulacionIndex].calificacion = calificacion;
        oferta.postulaciones[postulacionIndex].comentario = comentario;
        oferta.postulaciones[postulacionIndex].calificado = true;
        await oferta.save();
      }
    }
    
    res.status(201).json({ msg: "Valoración creada exitosamente", valoracion: nuevaValoracion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error en el servidor", error: err.message });
  }
});

// Obtener valoraciones de un usuario (músico o organizador)
router.get("/usuario/:usuarioId", async (req, res) => {
  try {
    const valoraciones = await Rating.find({ evaluado: req.params.usuarioId })
      .populate("evaluador", "name role")
      .populate("oferta", "titulo fechaEvento")
      .sort({ createdAt: -1 });
    
    res.json(valoraciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error en el servidor", error: err.message });
  }
});

// Verificar si un usuario ya valoró a otro en una oferta específica
router.get("/check/:ofertaId/:evaluadoId", authMiddleware, async (req, res) => {
  try {
    const valoracion = await Rating.findOne({
      oferta: req.params.ofertaId,
      evaluador: req.user.id,
      evaluado: req.params.evaluadoId
    });
    
    res.json({ yaValorado: !!valoracion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error en el servidor", error: err.message });
  }
});

module.exports = router;