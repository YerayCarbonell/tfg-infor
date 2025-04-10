// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ msg: 'No hay token, autorización denegada' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ msg: 'Token inválido - usuario no encontrado' });
      }

      req.user = {
        id: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email
      };

      next();
    } catch (err) {
      return res.status(401).json({ msg: 'Token inválido o expirado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

module.exports = auth;
