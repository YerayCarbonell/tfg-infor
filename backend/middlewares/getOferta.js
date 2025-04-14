// middlewares/getOferta.js

const Oferta = require('../models/Oferta');

module.exports = async function(req, res, next) {
  try {
    const oferta = await Oferta.findById(req.params.id)
      .populate('organizer', 'name email profile')
      .populate('postulaciones.musician', 'name email profile');
    
    if (!oferta) {
      return res.status(404).json({ mensaje: 'Oferta no encontrada' });
    }
    
    res.oferta = oferta;
    next();
  } catch (err) {
    console.error('Error en middleware getOferta:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ mensaje: 'Oferta no encontrada, ID inválido' });
    }
    return res.status(500).json({ mensaje: 'Error del servidor al buscar la oferta' });
  }
};