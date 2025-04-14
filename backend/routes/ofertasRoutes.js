const express = require('express');
const router = express.Router();
const Oferta = require('../models/Oferta');
const authMiddleware = require('../middlewares/auth');
const getOferta = require('../middlewares/getOferta');

// Listar ofertas con filtros opcionales
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.genero) filter.genero = req.query.genero;
    if (req.query.ubicacion) filter.ubicacion = req.query.ubicacion;
    if (req.query.organizer) filter.organizer = req.query.organizer;

    const ofertas = await Oferta.find(filter)
      .populate('organizer', 'name email profile');
    
    res.json(ofertas);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});


// Obtener una oferta por ID
router.get('/:id', async (req, res) => {
  try {
    const oferta = await Oferta.findById(req.params.id)
      .populate('organizer', 'name email profile');
    
    if (!oferta) {
      return res.status(404).json({ mensaje: 'Oferta no encontrada.' });
    }

    res.json(oferta);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener la oferta.' });
  }
});

// Crear una nueva oferta (solo para organizadores)
// Ruta para crear una nueva oferta
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body);
    console.log('Usuario autenticado:', req.user);
    
    // Verificar rol de usuario
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ mensaje: 'Acceso denegado. No eres organizador.' });
    }
    
    // Verificar datos requeridos
    const { titulo, descripcion } = req.body;
    if (!titulo || !descripcion) {
      return res.status(400).json({ mensaje: 'El título y la descripción son obligatorios.' });
    }
    
    // Crear modelo de oferta
    const oferta = new Oferta({
      titulo,
      descripcion,
      fechaEvento: req.body.fechaEvento || null,
      genero: req.body.genero || null,
      ubicacion: req.body.ubicacion || null,
      organizer: req.user.id
    });
    
    // Guardar en la base de datos
    const nuevaOferta = await oferta.save();
    console.log('Oferta creada:', nuevaOferta);
    
    res.status(201).json(nuevaOferta);
  } catch (err) {
    console.error('Error al crear oferta:', err);
    if (err.name === 'ValidationError') {
      // Error de validación de mongoose
      return res.status(400).json({ mensaje: Object.values(err.errors).map(val => val.message).join(', ') });
    }
    res.status(500).json({ mensaje: 'Error del servidor al crear la oferta.' });
  }
});

// Actualizar una oferta (solo para el organizador que la creó)
router.put('/:id', authMiddleware, getOferta, async (req, res) => {
  const organizadorId = typeof res.oferta.organizer === 'object' 
    ? res.oferta.organizer._id 
    : res.oferta.organizer;

  if (organizadorId.toString() !== req.user.id) {
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

// Eliminar una oferta (solo para el organizador que la creó)
router.delete('/:id', authMiddleware, getOferta, async (req, res) => {
  // Corregido: Verificación del ID del organizador
  const organizadorId = typeof res.oferta.organizer === 'object' 
    ? res.oferta.organizer._id 
    : res.oferta.organizer;

  if (organizadorId.toString() !== req.user.id) {
    return res.status(403).json({ mensaje: 'Acceso denegado. No eres el organizador de esta oferta.' });
  }
  
  try {
    // Corregido: remove() está obsoleto, usar deleteOne()
    await Oferta.deleteOne({ _id: res.oferta._id });
    res.json({ mensaje: 'Oferta eliminada' });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

// Postulación a una oferta (solo para músicos)
router.post('/:id/postular', authMiddleware, getOferta, async (req, res) => {
  if (req.user.role !== 'musician') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo músicos pueden postularse.' });
  }

  const yaPostulado = res.oferta.postulaciones.find(postulacion => postulacion.musician.toString() === req.user.id);
  if (yaPostulado) {
    return res.status(400).json({ mensaje: 'Ya has postulado a esta oferta.' });
  }

  const { motivacion } = req.body;
  res.oferta.postulaciones.push({ musician: req.user.id, estado: 'PENDIENTE', motivacion });

  try {
    const ofertaActualizada = await res.oferta.save();
    res.status(201).json({ mensaje: 'Postulación realizada correctamente', oferta: ofertaActualizada });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al procesar la postulación. Por favor, inténtalo de nuevo.' });
  }
});


// Actualizar estado de una oferta (abierta, cerrada, cancelada)
router.patch('/:id/estado', authMiddleware, getOferta, async (req, res) => {
  try {
    const organizadorId = typeof res.oferta.organizer === 'object' 
      ? res.oferta.organizer._id 
      : res.oferta.organizer;

    if (organizadorId.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No eres el organizador de esta oferta.' });
    }
    
    const { estado, fechaCierre, tieneAceptada } = req.body;
    
    // Validar el estado
    if (estado && !['ABIERTA', 'CERRADA', 'CANCELADA'].includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado inválido.' });
    }
    
    // Actualizar los campos según lo que se envió
    if (estado) res.oferta.estado = estado;
    if (fechaCierre) res.oferta.fechaCierre = fechaCierre;
    if (tieneAceptada !== undefined) res.oferta.tieneAceptada = tieneAceptada;
    
    const ofertaActualizada = await res.oferta.save();
    
    res.json({
      mensaje: 'Estado de la oferta actualizado correctamente',
      oferta: ofertaActualizada
    });
  } catch (err) {
    console.error('Error al actualizar estado de oferta:', err);
    res.status(500).json({ mensaje: 'Error al procesar la solicitud' });
  }
});



// Listar postulaciones de una oferta (solo para el organizador)
router.get('/:id/postulaciones', authMiddleware, getOferta, async (req, res) => {
  // Corregido: organizador_id a organizador._id
  const organizadorId = typeof res.oferta.organizer === 'object' 
    ? res.oferta.organizer._id 
    : res.oferta.organizer;

  if (organizadorId.toString() !== req.user.id) {
    return res.status(403).json({ mensaje: 'Acceso denegado. No eres el organizador de esta oferta.' });
  }
  
  try {
    await res.oferta.populate('postulaciones.musician', 'name email profile');
    res.json(res.oferta.postulaciones);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

// Actualizar el estado de una postulación (aceptar/rechazar)
router.put('/:id/postulaciones/:postulacionId', authMiddleware, getOferta, async (req, res) => {
  // Corregido: Verificación del ID del organizador
  const organizadorId = typeof res.oferta.organizer === 'object' 
    ? res.oferta.organizer._id 
    : res.oferta.organizer;

  if (organizadorId.toString() !== req.user.id) {
    return res.status(403).json({ mensaje: 'Acceso denegado. No eres el organizador de esta oferta.' });
  }
  
  const { estado } = req.body; // Se espera 'aceptada' o 'rechazada'
  if (!['ACEPTADA', 'RECHAZADA'].includes(estado)) {
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


// Aceptar una postulación y manejar el estado de la oferta
router.post('/:id/postulaciones/:postulacionId/aceptar', authMiddleware, getOferta, async (req, res) => {
  try {
    const organizadorId = typeof res.oferta.organizer === 'object' 
      ? res.oferta.organizer._id 
      : res.oferta.organizer;

    if (organizadorId.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No eres el organizador de esta oferta.' });
    }
    
    const postulacionIndex = res.oferta.postulaciones.findIndex(
      p => p._id.toString() === req.params.postulacionId
    );
    
    if (postulacionIndex === -1) {
      return res.status(404).json({ mensaje: 'Postulación no encontrada.' });
    }

    // Verificar que la postulación tiene un músico asignado
    if (!res.oferta.postulaciones[postulacionIndex].musician) {
      return res.status(400).json({ mensaje: 'La postulación no tiene un músico asignado.' });
    }
    
    // Verificar que la postulación esté pendiente
    const estadoActual = res.oferta.postulaciones[postulacionIndex].estado;
    if (estadoActual !== 'PENDIENTE') {
      return res.status(400).json({ mensaje: 'Solo se pueden aceptar postulaciones pendientes.' });
    }

    // Aceptar esta y rechazar todas las demás
    res.oferta.postulaciones.forEach((p, i) => {
      if (i === postulacionIndex) {
        p.estado = 'ACEPTADA';
      } else if (p.estado === 'PENDIENTE') {
        p.estado = 'RECHAZADA';
      }
    });
    
    // Marcar que la oferta tiene al menos una postulación aceptada
    res.oferta.tieneAceptada = true;
    
    // Si se envió cerrarOferta=true, cambiar el estado a CERRADA
    const { cerrarOferta } = req.body;
    if (cerrarOferta) {
      res.oferta.estado = 'CERRADA';
      res.oferta.fechaCierre = new Date();
    }
    
    res.oferta.tieneAceptada = res.oferta.postulaciones.some(p => p.estado === 'ACEPTADA');

    await res.oferta.save();
    
    // Opcional: Enviar mensaje automático al músico
    // Esto requeriría lógica adicional de mensajería que podemos implementar después
    
    res.json({ 
      mensaje: 'Postulación aceptada correctamente', 
      oferta: res.oferta,
      ofertaCerrada: cerrarOferta || false
    });
  } catch (err) {
    console.error('Error al aceptar postulación:', err);
    res.status(500).json({ mensaje: 'Error al procesar la solicitud' });
  }
});


// Rechazar una postulación
router.post('/:id/postulaciones/:postulacionId/rechazar', authMiddleware, getOferta, async (req, res) => {
  try {
    const organizadorId = typeof res.oferta.organizer === 'object' 
      ? res.oferta.organizer._id 
      : res.oferta.organizer;

    if (organizadorId.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'Acceso denegado. No eres el organizador de esta oferta.' });
    }
    
    // Buscar y actualizar la postulación por índice, no por id()
    const postulacionIndex = res.oferta.postulaciones.findIndex(
      p => p._id.toString() === req.params.postulacionId
    );
    
    if (postulacionIndex === -1) {
      return res.status(404).json({ mensaje: 'Postulación no encontrada.' });
    }
    
    // Actualizar directamente el estado en el array
    const estadoActual = res.oferta.postulaciones[postulacionIndex].estado;
    if (estadoActual !== 'PENDIENTE') {
      return res.status(400).json({ mensaje: 'Solo se pueden rechazar postulaciones pendientes.' });
    }
    
    res.oferta.postulaciones[postulacionIndex].estado = 'RECHAZADA';
        
    res.oferta.tieneAceptada = res.oferta.postulaciones.some(p => p.estado === 'ACEPTADA');

    // Guardar el documento actualizado
    await res.oferta.save();
    
    res.json({ mensaje: 'Postulación rechazada correctamente', oferta: res.oferta });
  } catch (err) {
    console.error('Error al rechazar postulación:', err);
    res.status(500).json({ mensaje: 'Error al procesar la solicitud' });
  }
});


module.exports = router;