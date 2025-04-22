const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema({
  oferta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Oferta",
    required: true
  },
  evaluador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  evaluado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  calificacion: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comentario: {
    type: String
  },
  // Tipo de evaluación: 'músico a organizador' o 'organizador a músico'
  tipo: {
    type: String,
    enum: ['musico-a-organizador', 'organizador-a-musico'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Rating", RatingSchema);