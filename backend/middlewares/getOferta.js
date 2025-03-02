const Oferta = require('../models/Oferta');

async function getOferta(req, res, next) {
    let oferta;
    try {
        oferta = await Oferta.findById(req.params.id).populate('organizador', 'name email profile.local');
        if (oferta == null) {
            return res.status(404).json({ message: 'No se encontró la oferta' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.oferta = oferta;
    next();

}

module.exports = getOferta;