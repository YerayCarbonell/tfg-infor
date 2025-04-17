require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { faker } = require("@faker-js/faker");

// Configurar faker en español
faker.locale = "es";

// Modelos
const User = require("../models/User");
const Oferta = require("../models/Oferta");
const Mensaje = require("../models/Mensaje");

// Arrays extendidos de datos
const generos = [
  "Rock", "Jazz", "Pop", "Funk", "Metal", "Blues",
  "Reggae", "Clásica", "Electrónica", "Salsa", "Folclore", "Ska"
];
const ubicaciones = [
  "Alicante", "Valencia", "Murcia", "Madrid", "Barcelona",
  "Sevilla", "Bilbao", "Granada", "Zaragoza"
];
const instrumentos = [
  "Guitarra", "Batería", "Voz", "Bajo", "Teclado",
  "Violín", "Saxofón", "Trompeta", "Flauta"
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(from = 10, to = 30) {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * (to - from)) + from);
  return d;
}

async function connectDB() {
  await mongoose.connect(`${process.env.MONGO_URI}/test`);
  console.log("✅ Conectado a MongoDB (DB: test)");
}

async function clearDB() {
  await Promise.all([
    User.deleteMany({}),
    Oferta.deleteMany({}),
    Mensaje.deleteMany({})
  ]);
  console.log("🧹 Base de datos limpiada");
}

async function createUsers(password) {
  const organizadores = [];
  const musicos = [];

  // Crear 15 organizadores
  for (let i = 0; i < 15; i++) {
    const organizador = await User.create({
      name: faker.person.fullName(),
      email: `organizador${i}@musicoapp.com`,
      password,
      role: "organizer",
      profile: {
        bio: faker.lorem.paragraph(),
        phone: faker.phone.number(),
        location: randomItem(ubicaciones),
        venueName: faker.company.name(),
        venueType: randomItem(["Club", "Sala", "Festival", "Teatro"]),
        capacity: faker.number.int({ min: 100, max: 3000 }),
        eventTypes: faker.helpers.arrayElements(
          ["Concierto", "Jam Session", "Festival", "Open Mic", "Show acústico"],
          2
        ),
        redesSociales: {
          facebook: `https://facebook.com/${faker.internet.username()}`,
          instagram: `https://instagram.com/${faker.internet.username()}`
        }
      },
      multimedia: {
        profilePhoto: faker.image.avatar(),
        fotos: Array.from({ length: 3 }, () => faker.image.url())
      }
    });
    organizadores.push(organizador);
  }

  // Crear 20 músicos
  // Crear 20 músicos
  for (let i = 0; i < 20; i++) {
    const musico = await User.create({
      name: faker.person.fullName(),
      email: `musico${i}@musicoapp.com`,
      password,
      role: "musician",
      profile: {
        bio: faker.lorem.paragraph(),
        phone: faker.phone.number(),
        location: randomItem(ubicaciones),
        genres: faker.helpers.arrayElements(generos, 2), // <== CAMBIO AQUÍ
        instruments: faker.helpers.arrayElements(instrumentos, 2),
        experience: `${faker.number.int({ min: 1, max: 15 })} años de experiencia`,
        influencias: faker.helpers.arrayElements(
          ["The Beatles", "Queen", "David Bowie", "Led Zeppelin", "Pink Floyd", "AC/DC"],
          2
        )
      },
      multimedia: {
        profilePhoto: faker.image.avatar(),
        fotos: Array.from({ length: 2 }, () => faker.image.url()),
        audio: Array.from({ length: 1 }, () => faker.internet.url())
      }
    });
    musicos.push(musico);
  }


  return { organizers: organizadores, musicians: musicos };
}

async function createOfertas(organizers, musicians) {
  // Para cada organizador, generamos entre 1 y 3 ofertas
  for (let organizador of organizers) {
    const numOfertas = faker.number.int({ min: 1, max: 3 });
    for (let j = 0; j < numOfertas; j++) {
      const generoSeleccionado = randomItem(generos);
      const ubicacionSeleccionada = randomItem(ubicaciones);
      const titulo = `Concierto de ${generoSeleccionado} en ${ubicacionSeleccionada}`;
      const descripcion = `Te invitamos a disfrutar de una noche de música ${generoSeleccionado} en el local ${organizador.profile.venueName}, ubicado en ${ubicacionSeleccionada}. 
El evento se realizará el próximo día ${new Date(getRandomDate(30, 60)).toLocaleDateString("es-ES")} y contará con la participación de destacados artistas del género. ¡No te lo pierdas!`;

      const postulaciones = [];
      const numPostulaciones = faker.number.int({ min: 2, max: 5 });
      const selectedMusicians = musicians.sort(() => 0.5 - Math.random()).slice(0, numPostulaciones);

      selectedMusicians.forEach(musico => {
        const estado = randomItem(["ACEPTADA", "RECHAZADA", "PENDIENTE"]);
        postulaciones.push({
          musician: musico._id,
          motivacion: `Tengo amplia experiencia en presentaciones de ${generoSeleccionado} y estoy seguro de que puedo aportar un toque único al evento.`,
          estado,
          calificado: estado === "ACEPTADA",
          calificacion: estado === "ACEPTADA" ? faker.number.int({ min: 3, max: 5 }) : undefined,
          comentario: estado === "ACEPTADA" ? `¡Muchas gracias por la oportunidad!` : undefined
        });
      });

      const fechaCierre = getRandomDate(2, 20);
      const oferta = await Oferta.create({
        titulo,
        descripcion,
        fechaEvento: getRandomDate(30, 60),
        fechaCierre,
        genero: generoSeleccionado,
        ubicacion: ubicacionSeleccionada,
        organizer: organizador._id,
        postulaciones,
        tieneAceptada: postulaciones.some(p => p.estado === "ACEPTADA"),
        estado: new Date() > fechaCierre ? "CERRADA" : "ABIERTA",
        cachet: faker.finance.amount(50, 2000, 2, "€"),
        duracion: faker.number.int({ min: 60, max: 240 }), // en minutos
        tipoContrato: randomItem(["Por evento", "Contrato fijo", "Freelance"])
      });

      // Creación de mensajes para cada postulante
      for (const post of postulaciones) {
        await Mensaje.create({
          sender: post.musician,
          receiver: oferta.organizer,
          content: `Hola, estoy muy interesado en participar en este concierto. ¿Podrías brindarme más detalles sobre el evento?`,
          oferta: oferta._id
        });

        if (post.estado === "ACEPTADA") {
          await Mensaje.create({
            sender: oferta.organizer,
            receiver: post.musician,
            content: `¡Enhorabuena! Has sido seleccionado para participar en el concierto. Esperamos verte el día del evento.`,
            oferta: oferta._id,
            read: true
          });

          await Mensaje.create({
            sender: post.musician,
            receiver: oferta.organizer,
            content: `¡Muchas gracias! Estoy deseando aportar lo mejor de mí en el escenario.`,
            oferta: oferta._id
          });
        }
      }
    }
  }
}

async function seed() {
  try {
    await connectDB();
    await clearDB();

    const password = await bcrypt.hash("test1234", 10);
    const { organizers, musicians } = await createUsers(password);
    await createOfertas(organizers, musicians);

    console.log("🎉 Seeding completo con datos realistas en español.");
  } catch (err) {
    console.error("❌ Error durante el seeding:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  }
}

seed();
