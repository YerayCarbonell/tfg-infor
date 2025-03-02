const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middlewares/auth");
const upload = require("../middlewares/upload"); // Importar el middleware de subida de archivos

const router = express.Router();

// Ruta pública: Listar todos los usuarios (solo para pruebas)
router.get("/all", async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Excluye las contraseñas
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Error en el servidor", error: err.message });
  }
});

// Ruta protegida: Obtener información del usuario autenticado
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Excluye la contraseña
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado." });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error en el servidor", error: err.message });
  }
});

// UPDATE - Actualizar perfil de usuario
router.put("/profile", authMiddleware, async (req, res) => {
    try {
      const { name, profile } = req.body;
      const userId = req.user.id;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: "Usuario no encontrado" });
      }
  
      // Validar campos específicos según el rol
      if (user.role === "musico" && profile) {
        if (!profile.instrumentos || !profile.generos) {
          return res.status(400).json({ msg: "Los músicos deben mantener instrumentos y géneros" });
        }
      }
  
      if (user.role === "organizador" && profile) {
        if (!profile.local || !profile.tipoEventos) {
          return res.status(400).json({ msg: "Los organizadores deben mantener local y tipos de eventos" });
        }
      }
  
      // Actualizar campos
      if (name) user.name = name;
      if (profile) user.profile = { ...user.profile, ...profile };
  
      await user.save();
      res.json({ msg: "Perfil actualizado exitosamente", user });
    } catch (err) {
      res.status(500).json({ msg: "Error en el servidor", error: err.message });
    }
  });



// DELETE - Eliminar usuario
router.delete("/", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ msg: "Usuario no encontrado" });
      }
  
      await User.findByIdAndDelete(userId);
      res.json({ msg: "Usuario eliminado exitosamente" });
    } catch (err) {
      res.status(500).json({ msg: "Error en el servidor", error: err.message });
    }
  });

// Ruta protegida para subir archivos (imágenes o audio)
router.post("/upload", authMiddleware, upload.single("archivo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ msg: "No se subió ningún archivo" });
      }
  
      // Aquí puedes guardar la URL en la base de datos asociada al usuario
      const filePath = `/uploads/${req.file.filename}`;
  
      res.json({
        msg: "Archivo subido exitosamente",
        filePath
      });
    } catch (err) {
      res.status(500).json({ msg: "Error en el servidor", error: err.message });
    }
  });
  
  module.exports = router;

module.exports = router;
