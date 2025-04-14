// seed.js completo con 10 organizers, 10 musicians, 10 ofertas y mensajes cruzados
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Oferta = require("../models/Oferta");
const Mensaje = require("../models/Mensaje");

const generos = ["Rock", "Jazz", "Pop", "Funk", "Metal", "Blues"];
const ubicaciones = ["Alicante", "Valencia", "Murcia", "Madrid", "Barcelona"];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI + "/test");
    console.log("✅ Conectado a MongoDB (DB: test)");

    await Promise.all([
      User.deleteMany({}),
      Oferta.deleteMany({}),
      Mensaje.deleteMany({})
    ]);
    console.log("🧹 Base de datos limpiada");

    const password = await bcrypt.hash("test1234", 10);

    const organizers = [];
    const musicians = [];

    for (let i = 1; i <= 10; i++) {
      const organizer = await User.create({
        name: `Organizer ${i}`,
        email: `organizer${i}@musicfest.com`,
        password,
        role: "organizer",
        profile: {
          bio: "Organizador de eventos.",
          phone: `66600000${i}`,
          location: randomItem(ubicaciones),
          venueName: `Sala ${i}`,
          venueType: "Club",
          capacity: 100 + i * 50,
          eventTypes: ["Concierto", "Jam Session"]
        }
      });
      organizers.push(organizer);
    }

    for (let i = 1; i <= 10; i++) {
      const musician = await User.create({
        name: `Músico ${i}`,
        email: `musician${i}@musica.com`,
        password,
        role: "musician",
        profile: {
          bio: `Músico versátil ${i}`,
          phone: `60000000${i}`,
          location: randomItem(ubicaciones),
          genres: [randomItem(generos)],
          instruments: ["Guitarra", "Batería", "Voz"][i % 3],
          experience: `${2 + i} años en escenarios`
        }
      });
      musicians.push(musician);
    }

    for (let i = 0; i < 10; i++) {
      const postulaciones = [];
      const selectedMusicians = musicians.sort(() => 0.5 - Math.random()).slice(0, 2);
      const estados = ["ACEPTADA", "RECHAZADA", "PENDIENTE"];

      selectedMusicians.forEach((musician, idx) => {
        postulaciones.push({
          musician: musician._id,
          motivacion: `Motivación del músico ${musician.name}`,
          estado: estados[idx % estados.length],
          ...(idx === 0 ? {
            calificado: true,
            calificacion: 4 + i % 2,
            comentario: "Buena propuesta"
          } : {})
        });
      });

      const oferta = await Oferta.create({
        titulo: `Evento ${i + 1}`,
        descripcion: `Buscamos bandas para evento número ${i + 1}`,
        fechaEvento: new Date(`2025-07-${10 + i}`),
        fechaCierre: new Date(`2025-06-${5 + i}`),
        genero: randomItem(generos),
        ubicacion: randomItem(ubicaciones),
        organizer: organizers[i]._id,
        postulaciones,
        tieneAceptada: postulaciones.some(p => p.estado === "ACEPTADA")
      });

      // Mensajes simulados
      for (const post of postulaciones) {
        await Mensaje.create({
          sender: post.musician,
          receiver: organizers[i]._id,
          content: `Hola, soy ${post.musician} y me interesa la oferta.`,
          oferta: oferta._id
        });

        if (post.estado === "ACEPTADA") {
          await Mensaje.create({
            sender: organizers[i]._id,
            receiver: post.musician,
            content: "Te hemos aceptado para el evento!",
            oferta: oferta._id,
            read: true
          });
        }
      }
    }

    console.log("🎉 Seeding completo: 10 organizers, 10 musicians, 10 ofertas");
  } catch (err) {
    console.error("❌ Error durante el seeding:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  }
}

seed();