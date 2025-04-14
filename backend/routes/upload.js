// routes/upload.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');

// Configura el almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // crea este directorio si no existe
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Subida de imágenes (fotos)
router.post('/upload/foto', upload.single('foto'), (req, res) => {
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ url: filePath });
});

// Subida de audio
router.post('/upload/audio', upload.single('audio'), (req, res) => {
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ url: filePath });
});

// Eliminación de archivos
router.delete('/upload/:tipo', (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ msg: "La URL del archivo es requerida" });
  }
  
  // Extraer el nombre del archivo de la URL
  const fileName = url.split('/').pop();
  const filePath = path.join(__dirname, '../uploads', fileName);
  
  // Eliminar el archivo del sistema de archivos
  const fs = require('fs');
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error al eliminar archivo:", err);
      return res.status(500).json({ msg: "Error al eliminar el archivo" });
    }
    
    res.json({ msg: "Archivo eliminado correctamente" });
  });
});


router.post('/upload/profile-photo', upload.single('foto'), (req, res) => {
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ url: filePath });
});


module.exports = router;
