const express = require('express');
const router = express.Router();
const Oferta = require('../models/Oferta');
const User = require('../models/User');
const authMiddleware = require('../middlewares/auth');

// Crear una nueva postulación
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'musician') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo músicos pueden postularse.' });
  }
  
  const { ofertaId, motivacion } = req.body;
  
  try {
    // Buscar la oferta
    const oferta = await Oferta.findById(ofertaId);
    if (!oferta) {
      return res.status(404).json({ mensaje: 'Oferta no encontrada.' });
    }
    
    // Verificar que no haya postulado ya
    const yaPostulado = oferta.postulaciones.some(p => p.musico.toString() === req.user.id);
    if (yaPostulado) {
      return res.status(400).json({ mensaje: 'Ya has postulado a esta oferta.' });
    }
    
    // Añadir la postulación
    oferta.postulaciones.push({ 
      musico: req.user.id, 
      estado: 'PENDIENTE',
      motivacion,
      fechaPostulacion: new Date()
    });
    
    // Guardar la oferta actualizada
    await oferta.save();
    
    res.status(201).json({ mensaje: 'Postulación realizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al procesar la postulación' });
  }
});

// Obtener todas las postulaciones de un usuario (músico)
router.get('/usuario/:id', authMiddleware, async (req, res) => {
  try {
    // Verificar que el usuario que solicita sea el mismo cuyas postulaciones se quieren ver
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ mensaje: 'No autorizado para ver estas postulaciones' });
    }
    
    // Buscar todas las ofertas donde el usuario tiene postulaciones
    const ofertas = await Oferta.find({
      'postulaciones.musico': req.params.id
    }).populate('organizer', 'name email profile');
    
    // Extraer solo las postulaciones del usuario
    const postulaciones = [];
    ofertas.forEach(oferta => {
      oferta.postulaciones.forEach(postulacion => {
        if (postulacion.musico.toString() === req.params.id) {
          postulaciones.push({
            _id: postulacion._id,
            oferta: {
              _id: oferta._id,
              titulo: oferta.titulo,
              fechaEvento: oferta.fechaEvento,
              organizador: oferta.organizador
            },
            estado: postulacion.estado,
            motivacion: postulacion.motivacion,
            fechaPostulacion: postulacion.fechaPostulacion
          });
        }
      });
    });
    
    res.json(postulaciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener las postulaciones' });
  }
});

// Eliminar una postulación (cancelar postulación)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Buscar la oferta que contiene esta postulación
    const oferta = await Oferta.findOne({
      'postulaciones._id': req.params.id
    });
    
    if (!oferta) {
      return res.status(404).json({ mensaje: 'Postulación no encontrada' });
    }
    
    // Encontrar la postulación específica
    const postulacion = oferta.postulaciones.id(req.params.id);
    
    // Verificar que el usuario sea el dueño de la postulación
    if (postulacion.musico.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No autorizado para eliminar esta postulación' });
    }
    
    // Verificar que la postulación esté en estado pendiente
    if (postulacion.estado !== 'PENDIENTE') {
      return res.status(400).json({ mensaje: 'Solo se pueden cancelar postulaciones pendientes' });
    }
    
    // Eliminar la postulación
    postulacion.remove();
    await oferta.save();
    
    res.json({ mensaje: 'Postulación cancelada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al cancelar la postulación' });
  }
});

module.exports = router;