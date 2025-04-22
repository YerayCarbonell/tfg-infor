const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["musician", "organizer"], required: true },
  profile: {
    bio: { type: String },
    phone: { type: String },
    location: { type: String },
    // Músico
    genres: [String],
    instruments: [String],
    experience: { type: String },
    tarifa: { 
      monto: { type: Number }, 
      descripcion: { type: String } // "Por hora", "Por evento", etc.
    },
    // Organizador
    venueName: { type: String },
    venueType: { type: String },
    capacity: { type: Number },
    eventTypes: [String]
  },
  multimedia: {
    profilePhoto: { type: String },
    fotos: [String],
    audio: [String]
  }
  
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
