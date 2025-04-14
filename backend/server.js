require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Configurar Express
const app = express();
const server = http.createServer(app); // Crear servidor con HTTP

// Configurar Socket.io
const io = new Server(server, {
    cors: { origin: "*" }, // Permitir conexiones desde cualquier origen
});

// Middleware
app.use(express.json()); // Para leer JSON en las peticiones
app.use(cors()); // Para permitir solicitudes desde el frontend

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conexión a MongoDB exitosa'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Ruta base
app.get("/", (req, res) => {
    res.send("API funcionando 🚀");
});

// Importar rutas
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);
const ofertasRouter = require('./routes/ofertasRoutes');
app.use('/api/ofertas', ofertasRouter);
const postulacionesRoutes = require('./routes/postulacionesRoutes');
app.use('/api/postulaciones', postulacionesRoutes);
const chatRoutes = require("./routes/chatRoutes");
app.use("/api/chat", chatRoutes);
const eventoRoutes = require('./routes/eventoRoutes');
app.use('/api/eventos', eventoRoutes); 
app.use('/api', require('./routes/upload'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Configurar sockets para el chat
io.on("connection", (socket) => {
    console.log("Usuario conectado:", socket.id);

    socket.on("joinRoom", (userId) => {
        socket.join(userId);
        console.log(`Usuario ${userId} se ha unido a su sala privada`);
    });

    socket.on("sendMessage", async (data) => {
        const { sender, receiver, content } = data;

        try {
            const Message = require("./models/Message");
            const message = new Message({ sender, receiver, content });
            await message.save();

            // Emitir el mensaje al receptor
            io.to(receiver).emit("receiveMessage", message);
        } catch (error) {
            console.error("Error guardando mensaje:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("Usuario desconectado:", socket.id);
    });
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));