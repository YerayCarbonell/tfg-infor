const express = require('express');
const router = express.Router();
const Oferta = require('../models/Oferta');
const authMiddleware = require('../middlewares/auth');
const getOferta = require('../middlewares/getOferta');


// ===============================
// Listar ofertas con filtros opcionales
// ===============================
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.genero) filter.genero = req.query.genero;
    if (req.query.ubicacion) filter.ubicacion = req.query.ubicacion;
    // Puedes agregar más filtros según necesites

    const ofertas = await Oferta.find(filter).populate('organizer', 'name email profile.local');
    res.json(ofertas);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

// ===============================
// Obtener una oferta por ID
// ===============================
router.get('/:id', getOferta, (req, res) => {
  res.json(res.oferta);
});

// ===============================
// Crear una nueva oferta (solo para organizadores)
// ===============================
router.post('/', authMiddleware, async (req, res) => {
  // Se asume que el token contiene el id y role del usuario
  if (req.user.role !== 'organizer') {
    return res.status(403).json({ mensaje: 'Acceso denegado. No eres organizador.' });
  }
  const { titulo, descripcion, fechaEvento, genero, ubicacion } = req.body;
  const oferta = new Oferta({
    titulo,
    descripcion,
    fechaEvento,
    genero,
    ubicacion,
    organizador: req.user.id // Extraído del token
  });
  try {
    const nuevaOferta = await oferta.save();
    res.status(201).json(nuevaOferta);
  } catch (err) {
    res.status(400).json({ mensaje: err.message });
  }
});

// ===============================
// Actualizar una oferta (solo para el organizador que la creó)
// ===============================
router.put('/:id', authMiddleware, getOferta, async (req, res) => {

  if (res.oferta.organizador._id.toString() !== req.user.id) {
    return res.status(403).json({ mensaje: 'Acceso denegado. No eres el organizador de esta oferta.' });
  }
  const { titulo, descripcion, fechaEvento, genero, ubicacion } = req.body;
  if (titulo != null) res.oferta.titulo = titulo;
  if (descripcion != null) res.oferta.descripcion = descripcion;
  if (fechaEvento != null) res.oferta.fechaEvento = fechaEvento;
  if (genero != null) res.oferta.genero = genero;
  if (ubicacion != null) res.oferta.ubicacion = ubicacion;
  
  try {
    const ofertaActualizada = await res.oferta.save();
    res.json(ofertaActualizada);
  } catch (err) {
    res.status(400).json({ mensaje: err.message });
  }
});

// ===============================
// Eliminar una oferta (solo para el organizador que la creó)
// ===============================
router.delete('/:id', authMiddleware, getOferta, async (req, res) => {
  if (res.oferta.organizador._id.toString() !== req.user.id) {
    return res.status(403).json({ mensaje: 'Acceso denegado. No eres el organizador de esta oferta.' });
  }
  try {
    await res.oferta.remove();
    res.json({ mensaje: 'Oferta eliminada' });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

// ===============================
// Postulación a una oferta (solo para músicos)
// ===============================
router.post('/:id/postular', authMiddleware, getOferta, async (req, res) => {
  if (req.user.role !== 'musician') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo músicos pueden postularse.' });
  }

  const yaPostulado = res.oferta.postulaciones.find(postulacion => postulacion.musico.toString() === req.user.id);
  if (yaPostulado) {
    return res.status(400).json({ mensaje: 'Ya has postulado a esta oferta.' });
  }

  const { motivacion } = req.body;
  res.oferta.postulaciones.push({ musico: req.user.id, estado: 'PENDIENTE', motivacion });

  try {
    const ofertaActualizada = await res.oferta.save();
    res.status(201).json({ mensaje: 'Postulación realizada correctamente', oferta: ofertaActualizada });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al procesar la postulación. Por favor, inténtalo de nuevo.' });
  }
});


// ===============================
// Listar postulaciones de una oferta (solo para el organizador)
// ===============================
router.get('/:id/postulaciones', authMiddleware, getOferta, async (req, res) => {
  if (res.oferta.organizador_id.toString() !== req.user.id) {
    return res.status(403).json({ mensaje: 'Acceso denegado. No eres el organizador de esta oferta.' });
  }
  try {
    await res.oferta.populate('postulaciones.musico', 'name email profile');
    res.json(res.oferta.postulaciones);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

// ===============================
// Actualizar el estado de una postulación (aceptar/rechazar) (solo para el organizador)
// ===============================
router.put('/:id/postulaciones/:postulacionId', authMiddleware, getOferta, async (req, res) => {
  if (res.oferta.organizador._id.toString() !== req.user.id) {
    return res.status(403).json({ mensaje: 'Acceso denegado. No eres el organizador de esta oferta.' });
  }
  const { estado } = req.body; // Se espera 'aceptada' o 'rechazada'
  if (!['aceptada', 'rechazada'].includes(estado)) {
    return res.status(400).json({ mensaje: 'Estado inválido.' });
  }
  const index = res.oferta.postulaciones.findIndex(postulacion => postulacion._id.toString() === req.params.postulacionId);
  if (index === -1) {
    return res.status(404).json({ mensaje: 'Postulación no encontrada.' });
  }
  res.oferta.postulaciones[index].estado = estado;
  try {
    const ofertaActualizada = await res.oferta.save();
    res.json({ mensaje: 'Estado de postulación actualizado', oferta: ofertaActualizada });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});



module.exports = router;
