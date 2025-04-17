// Actualizar authRoutes.js para añadir una ruta de validación de token
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middlewares/auth");
const { sendWelcomeEmail } = require('../services/emailService');

const router = express.Router();

// Registro de usuario
router.post("/register", async (req, res) => {
    try {
      const { name, email, password, role, profile } = req.body;
  
      // Validación simple
      if (!name || !email || !password || !role) {
        return res.status(400).json({ msg: "Faltan campos obligatorios" });
      }
  
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ msg: "El email ya está registrado" });
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role,
        profile
      });
  
      await newUser.save();

      await sendWelcomeEmail(email, name);

  
      // Crear token JWT para autenticación automática después del registro
      const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
  
      res.status(201).json({ 
        msg: "Usuario registrado con éxito",
        token,
        user: { id: newUser._id, name: newUser.name, role: newUser.role }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Error en el servidor", error: err.message });
    }
});

// Login de usuario
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Credenciales incorrectas" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Credenciales incorrectas" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
    } catch (err) {
        res.status(500).json({ msg: "Error en el servidor", error: err.message });
    }
});

// Ruta para validar el token del usuario
router.get("/validate", auth, async (req, res) => {
    try {
        // El middleware 'auth' ya ha añadido el usuario a req.user
        res.json({ 
            isValid: true, 
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (err) {
        res.status(500).json({ msg: "Error en el servidor", error: err.message });
    }
});

module.exports = router;