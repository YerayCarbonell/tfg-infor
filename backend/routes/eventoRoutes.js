// Crear un nuevo archivo eventosRoutes.js

const express = require('express');
const router = express.Router();
const Oferta = require('../models/Oferta');
const authMiddleware = require('../middlewares/auth');

// Historial de eventos para organizadores
router.get('/historial/organizador', authMiddleware, async (req, res) => {
  try {
    // Verificar que el usuario es organizador
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ mensaje: 'Acceso denegado. No eres organizador.' });
    }
    
    // Buscar ofertas cerradas o con fecha de evento en el pasado
    const hoy = new Date();
    const eventos = await Oferta.find({
      organizer: req.user.id,
      $or: [
        { estado: 'CERRADA' },
        { fechaEvento: { $lt: hoy } }
      ]
    })
    .populate('postulaciones.musician', 'name email profile')
    .sort({ fechaEvento: -1 });
    
    // Transformar los datos para mostrar solo postulaciones aceptadas como músicos
    const eventosFormateados = eventos.map(evento => {
      const musicosAceptados = evento.postulaciones
        .filter(p => p.estado === 'ACEPTADA')
        .map(p => ({
          _id: p.musician._id,
          name: p.musician.name,
          email: p.musician.email,
          profile: p.musician.profile
        }));
        
      return {
        _id: evento._id,
        titulo: evento.titulo,
        descripcion: evento.descripcion,
        fechaEvento: evento.fechaEvento,
        ubicacion: evento.ubicacion,
        genero: evento.genero,
        estado: evento.estado,
        fechaCierre: evento.fechaCierre,
        fechaCreacion: evento.fechaCreacion,
        musicos: musicosAceptados
      };
    });
    
    res.json(eventosFormateados);
  } catch (err) {
    console.error('Error al obtener historial:', err);
    res.status(500).json({ mensaje: 'Error al obtener el historial de eventos.' });
  }
});

// Historial de eventos para músicos
router.get('/historial/musico', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'musician') {
      return res.status(403).json({ mensaje: 'Acceso denegado. No eres músico.' });
    }

    const hoy = new Date();
    
    // Buscar todas las ofertas que tengan alguna postulación del usuario
    const ofertas = await Oferta.find({
      'postulaciones.musician': req.user.id
    })
      .populate('organizer', 'name email profile')
      .sort({ fechaEvento: -1 });

    const eventos = ofertas
      .map(oferta => {
        // Encontrar la postulación aceptada de este músico
        const postulacion = oferta.postulaciones.find(
          p => p.musician.toString() === req.user.id && p.estado === 'ACEPTADA'
        );

        if (!postulacion) return null; // no mostrar si no fue aceptado

        return {
          _id: oferta._id,
          titulo: oferta.titulo,
          descripcion: oferta.descripcion,
          fechaEvento: oferta.fechaEvento,
          ubicacion: oferta.ubicacion,
          genero: oferta.genero,
          estado: oferta.estado,
          fechaCreacion: oferta.fechaCreacion,
          organizador: {
            _id: oferta.organizer._id,
            name: oferta.organizer.name,
            email: oferta.organizer.email,
            profile: oferta.organizer.profile
          },
          calificado: postulacion.calificado || false,
          fechaPostulacion: postulacion.fechaPostulacion || null
        };
      })
      .filter(evento => evento !== null); // eliminar los eventos sin postulación aceptada

    res.json(eventos);
  } catch (err) {
    console.error('Error al obtener historial:', err);
    res.status(500).json({ mensaje: 'Error al obtener el historial de eventos.' });
  }
});


// Calificar un evento (para músicos)
router.post('/:id/calificar', authMiddleware, async (req, res) => {
  try {
    // Verificar que el usuario es músico
    if (req.user.role !== 'musician') {
      return res.status(403).json({ mensaje: 'Acceso denegado. No eres músico.' });
    }
    
    const { calificacion, comentario } = req.body;
    
    if (!calificacion || calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ mensaje: 'Calificación inválida.' });
    }
    
    // Buscar la oferta por ID
    const oferta = await Oferta.findById(req.params.id);
    if (!oferta) {
      return res.status(404).json({ mensaje: 'Evento no encontrado.' });
    }
    
    // Buscar la postulación del músico dentro de la oferta
    const postulacionIndex = oferta.postulaciones.findIndex(
      p => p.musician.toString() === req.user.id && p.estado === 'ACEPTADA'
    );
    
    if (postulacionIndex === -1) {
      return res.status(404).json({ mensaje: 'No tienes una postulación aceptada para este evento.' });
    }
    
    // Actualizar la calificación y comentario
    oferta.postulaciones[postulacionIndex].calificacion = calificacion;
    oferta.postulaciones[postulacionIndex].comentario = comentario;
    oferta.postulaciones[postulacionIndex].calificado = true;
    
    await oferta.save();
    
    res.json({ mensaje: 'Calificación guardada correctamente.' });
  } catch (err) {
    console.error('Error al calificar evento:', err);
    res.status(500).json({ mensaje: 'Error al procesar la calificación.' });
  }
});

module.exports = router;