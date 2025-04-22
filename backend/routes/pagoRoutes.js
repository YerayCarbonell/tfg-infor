// Crear archivo routes/pagoRoutes.js
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Oferta = require('../models/Oferta');
const Usuario = require('../models/User');
const auth = require('../middlewares/auth');

// Ruta para crear una intención de pago
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { ofertaId, postulacionId } = req.body;
    
    // Verificar que el usuario sea organizador
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ mensaje: 'Solo organizadores pueden realizar pagos' });
    }
    
    // Obtener la oferta con la postulación
    const oferta = await Oferta.findById(ofertaId);
    if (!oferta) {
      return res.status(404).json({ mensaje: 'Oferta no encontrada' });
    }
    
    // Verificar que el organizador sea el propietario de la oferta
    if (oferta.organizer.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para pagar esta oferta' });
    }
    
    // Encontrar la postulación específica
    const postulacion = oferta.postulaciones.id(postulacionId);
    if (!postulacion) {
      return res.status(404).json({ mensaje: 'Postulación no encontrada' });
    }
    
    // Crear intención de pago (ajusta el precio según tus necesidades)
    const amount = req.body.amount || 5000; // Ejemplo: 50€ en céntimos
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'eur',
      metadata: {
        ofertaId: ofertaId,
        postulacionId: postulacionId
      }
    });
    
    res.status(200).json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error al crear intención de pago:', error);
    res.status(500).json({ mensaje: 'Error al procesar el pago' });
  }
});

// Ruta para confirmar el pago y actualizar el estado
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { ofertaId, postulacionId } = req.body;
    
    const oferta = await Oferta.findById(ofertaId);
    if (!oferta) {
      return res.status(404).json({ mensaje: 'Oferta no encontrada' });
    }
    
    // Actualizar estado de la postulación
    const postulacion = oferta.postulaciones.id(postulacionId);
    if (postulacion) {
      postulacion.estado = 'ACEPTADA';
      oferta.tieneAceptada = true;
      await oferta.save();
      
      res.status(200).json({ mensaje: 'Pago completado y postulación aceptada' });
    } else {
      res.status(404).json({ mensaje: 'Postulación no encontrada' });
    }
  } catch (error) {
    console.error('Error al confirmar pago:', error);
    res.status(500).json({ mensaje: 'Error al procesar la confirmación' });
  }
});

module.exports = router;