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
// UPDATE - Actualizar perfil de usuario
// Modificación para el router.put("/profile") en userRoutes.js
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email, profile, multimedia } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Solo validar los campos de perfil si se están actualizando específicamente
    if (user.role === "musician" && profile) {
      // Comprobar si estamos intentando actualizar instrumentos o géneros específicamente
      // Si los campos ya existen en el usuario y no se están modificando, no validar
      if (
        (profile.hasOwnProperty('instruments') && (!profile.instruments?.length)) ||
        (profile.hasOwnProperty('genres') && (!profile.genres?.length))
      ) {
        return res.status(400).json({ msg: "Los músicos deben tener instrumentos y géneros musicales especificados" });
      }
    }

    if (user.role === "organizer" && profile) {
      if (
        (profile.hasOwnProperty('venueName') && (!profile.venueName)) ||
        (profile.hasOwnProperty('eventTypes') && (!profile.eventTypes?.length))
      ) {
        return res.status(400).json({ msg: "Los organizadores deben tener nombre del local y tipos de eventos especificados" });
      }
    }

    // Actualizar campos
    if (name) user.name = name;
    if (email) user.email = email;
    
    // Actualizar campos del perfil de manera segura
    if (profile) {
      // Asegurarse de que user.profile exista
      if (!user.profile) user.profile = {};
      
      // Actualizar cada campo del perfil de manera individual
      Object.keys(profile).forEach(key => {
        // Para tarifa, necesitamos un manejo especial
        if (key === 'tarifa') {
          user.profile.tarifa = {
            ...user.profile.tarifa || {},  // Preservar valores existentes
            ...profile.tarifa              // Actualizar con nuevos valores
          };
        } else {
          user.profile[key] = profile[key];
        }
      });
    }
    
    // Actualizar multimedia
    if (multimedia) {
      // Asegurarse de que user.multimedia exista
      if (!user.multimedia) user.multimedia = {};
      
      // Actualizar cada campo de multimedia
      Object.keys(multimedia).forEach(key => {
        user.multimedia[key] = multimedia[key];
      });
    }

    await user.save();
    res.json({ msg: "Perfil actualizado exitosamente", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error en el servidor", error: err.message });
  }
});

// Ruta para obtener un usuario específico por ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado." });
    }
    res.json(user);
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
