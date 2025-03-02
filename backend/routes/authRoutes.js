const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Registro de usuario
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role, profile } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: "El email ya está registrado" });

        const hashedPassword = await bcrypt.hash(password, 10);

        user = new User({
            name, email, password: hashedPassword, role, profile
        });

        await user.save();

        res.status(201).json({ msg: "Usuario registrado con éxito" });
    } catch (err) {
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

module.exports = router;
