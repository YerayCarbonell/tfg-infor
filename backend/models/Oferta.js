const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postulacionSchema = new Schema({
  musico: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  estado: { 
    type: String, 
    enum: ['PENDIENTE', 'ACEPTADA', 'RECHAZADA'], 
    default: 'PENDIENTE' 
  },
  motivacion: { type: String }, // Campo para la motivación del músico
  fechaPostulacion: { type: Date, default: Date.now }
});

const ofertaSchema = new Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  // Referencia al usuario organizador (quien crea la oferta)
  organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fechaEvento: { type: Date },
  fechaCreacion: { type: Date, default: Date.now },
  genero: { type: String },      // Campo para filtrar por género musical
  ubicacion: { type: String },     // Campo para filtrar por ubicación
  // Array de postulaciones que relaciona a músicos con la oferta
  postulaciones: [postulacionSchema]
});

module.exports = mongoose.model('Oferta', ofertaSchema);