const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  receiver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  oferta: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Oferta",
    default: null 
  },
  // Agregar metadatos adicionales que pueden ser útiles
  deletedBySender: {
    type: Boolean,
    default: false
  },
  deletedByReceiver: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,
  // Añadir índices para mejorar el rendimiento en consultas frecuentes
  indexes: [
    { sender: 1, receiver: 1 },
    { receiver: 1, read: 1 },
    { oferta: 1 },
    { createdAt: -1 }
  ]
});

// Método virtual para verificar si un mensaje es visible para un usuario específico
MessageSchema.methods.isVisibleTo = function(userId) {
  const isUserSender = this.sender.toString() === userId;
  const isUserReceiver = this.receiver.toString() === userId;

  if (!isUserSender && !isUserReceiver) {
    return false;
  }

  if (isUserSender && this.deletedBySender) {
    return false;
  }

  if (isUserReceiver && this.deletedByReceiver) {
    return false;
  }

  return true;
};


// Método para marcar un mensaje como leído
MessageSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    await this.save();
  }
  return this;
};

module.exports = mongoose.model("Mensaje", MessageSchema);