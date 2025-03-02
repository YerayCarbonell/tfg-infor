const express = require("express");
const router = express.Router();
const Message = require("../models/Mensaje");
const auth = require("../middlewares/auth"); // Middleware de autenticación

// Enviar mensaje
router.post("/messages", auth, async (req, res) => {
  try {
    const { receiver, content } = req.body;
    const sender = req.user.id; // ID del usuario autenticado

    if (!receiver || !content) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    const message = new Message({ sender, receiver, content });
    await message.save();

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ msg: "Error enviando mensaje", error });
  }
});

// Obtener mensajes de una conversación
router.get("/messages/:userId", auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUser = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: currentUser, receiver: userId },
        { sender: userId, receiver: currentUser }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ msg: "Error obteniendo mensajes", error });
  }
});

module.exports = router;
