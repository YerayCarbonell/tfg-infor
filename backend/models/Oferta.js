// models/Oferta.js
const mongoose = require('mongoose');

const postulacionSchema = new mongoose.Schema({
  musician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  estado: {
    type: String,
    enum: ['PENDIENTE', 'ACEPTADA', 'RECHAZADA'],
    default: 'PENDIENTE'
  },
  fechaPostulacion: {
    type: Date,
    default: Date.now
  },
  motivacion: String,
  calificacion: {
    type: Number,
    min: 1,
    max: 5
  },
  comentario: String,
  calificado: {
    type: Boolean,
    default: false
  }
});

const ofertaSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true
  },
  fechaEvento: {
    type: Date,
    required: false
  },
  genero: String,
  ubicacion: String,
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postulaciones: [postulacionSchema],
  estado: {
    type: String,
    enum: ['ABIERTA', 'CERRADA', 'CANCELADA'],
    default: 'ABIERTA'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaCierre: Date,
  tieneAceptada: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Oferta', ofertaSchema);