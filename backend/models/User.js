const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["musico", "organizador"], required: true },
    profile: {
        bio: { type: String },
        instrumentos: [String], // Solo para músicos
        generos: [String], // Solo para músicos
        local: { type: String }, // Solo para organizadores
        tipoEventos: [String] // Solo para organizadores
    },
    multimedia: {
        fotos: [String],
        audio: [String]
    }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
