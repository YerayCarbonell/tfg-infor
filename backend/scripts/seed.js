require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { faker } = require("@faker-js/faker");
mongoose.set('strictQuery', false);

// Configurar faker en español
faker.locale = "es";

// Modelos
const User = require("../models/User");
const Oferta = require("../models/Oferta");
const Mensaje = require("../models/Mensaje");
const Rating = require("../models/Rating"); // Importamos el modelo Rating

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

// Comentarios para valoraciones
const comentariosPositivos = [
  "Excelente profesional, muy puntual y con gran talento.",
  "Una experiencia increíble, superó todas mis expectativas.",
  "Muy buena actitud y profesionalismo. Recomendado totalmente.",
  "Gran nivel musical y trato muy agradable.",
  "Perfecto en todos los aspectos, volveríamos a trabajar juntos sin duda."
];

const comentariosNeutros = [
  "Buen trabajo en general, aunque con algunos aspectos a mejorar.",
  "Correcto en su labor, cumplió con lo acordado.",
  "Experiencia satisfactoria en términos generales.",
  "Nivel adecuado para el evento, aunque esperaba un poco más de entusiasmo."
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(from = 10, to = 30) {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * (to - from)) + from);
  return d;
}

function getPastDate(from = 10, to = 60) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * (to - from)) - from);
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
    Mensaje.deleteMany({}),
    Rating.deleteMany({}) // Limpiamos también las valoraciones
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
        genres: faker.helpers.arrayElements(generos, 2),
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
  const ofertasCreadas = [];
  
  // Para cada organizador, generamos entre 3 y 6 ofertas
  for (let organizador of organizers) {
    const numOfertas = faker.number.int({ min: 3, max: 6 });
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
          calificado: estado === "ACEPTADA" ? faker.datatype.boolean() : false,
          calificacion: estado === "ACEPTADA" && faker.datatype.boolean() ? faker.number.int({ min: 3, max: 5 }) : undefined,
          comentario: estado === "ACEPTADA" && faker.datatype.boolean() ? `¡Muchas gracias por la oportunidad!` : undefined
        });
      });

      // Algunas ofertas serán pasadas para poder crear valoraciones
      const esPasada = j === 0 ? true : faker.datatype.boolean(0.3); // 30% de probabilidad de ser pasada
      const fechaEvento = esPasada ? getPastDate(5, 45) : getRandomDate(30, 60);
      const fechaCierre = esPasada ? getPastDate(45, 60) : getRandomDate(2, 20);

      const oferta = await Oferta.create({
        titulo,
        descripcion,
        fechaEvento,
        fechaCierre,
        genero: generoSeleccionado,
        ubicacion: ubicacionSeleccionada,
        organizer: organizador._id,
        postulaciones,
        tieneAceptada: postulaciones.some(p => p.estado === "ACEPTADA"),
        estado: esPasada ? "CERRADA" : (new Date() > fechaCierre ? "CERRADA" : "ABIERTA"),
        cachet: faker.finance.amount(50, 2000, 2, "€"),
        duracion: faker.number.int({ min: 60, max: 240 }), // en minutos
        tipoContrato: randomItem(["Por evento", "Contrato fijo", "Freelance"])
      });
      
      ofertasCreadas.push(oferta);

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
  
  return ofertasCreadas;
}

async function createRatings(ofertas) {
  console.log("🌟 Creando valoraciones...");
  const allUsers = await User.find();

  let contadorValoraciones = 0;
  
  for (const oferta of ofertas) {
    // Solo creamos valoraciones para ofertas pasadas y cerradas
    if (oferta.estado === "CERRADA" && new Date(oferta.fechaEvento) < new Date()) {
      const aceptados = oferta.postulaciones.filter(p => p.estado === "ACEPTADA");
      
      // Obtener el organizador
      const organizador = await User.findById(oferta.organizer);
      
      // Para cada músico aceptado, crear valoraciones
      for (const postulacion of aceptados) {
        const musico = await User.findById(postulacion.musician);
        
        // 70% de probabilidad de que el organizador valore al músico
        if (faker.datatype.boolean(0.7)) {
          const calificacion = faker.number.int({ min: 3, max: 5 });
          const comentario = calificacion >= 4 
            ? randomItem(comentariosPositivos)
            : randomItem(comentariosNeutros);
            
          await Rating.create({
            oferta: oferta._id,
            evaluador: organizador._id,
            evaluado: musico._id,
            calificacion,
            comentario,
            tipo: 'organizador-a-musico'
          });
          
          contadorValoraciones++;
          
          // Actualizar la postulación para marcarla como calificada
          const postulacionIndex = oferta.postulaciones.findIndex(
            p => p.musician.toString() === musico._id.toString()
          );
          
          if (postulacionIndex !== -1) {
            oferta.postulaciones[postulacionIndex].calificacion = calificacion;
            oferta.postulaciones[postulacionIndex].comentario = comentario;
            oferta.postulaciones[postulacionIndex].calificado = true;
          }
        }
        
        // 60% de probabilidad de que el músico valore al organizador
        if (faker.datatype.boolean(0.6)) {
          const calificacion = faker.number.int({ min: 3, max: 5 });
          const comentario = calificacion >= 4 
            ? randomItem(comentariosPositivos)
            : randomItem(comentariosNeutros);
            
          await Rating.create({
            oferta: oferta._id,
            evaluador: musico._id,
            evaluado: organizador._id,
            calificacion,
            comentario,
            tipo: 'musico-a-organizador'
          });
          
          contadorValoraciones++;
        }
      }
      
      // Guardar las actualizaciones en la oferta
      await oferta.save();
    }
  }


  
for (const user of allUsers) {
    const valoraciones = await Rating.countDocuments({
      $or: [{ evaluador: user._id }, { evaluado: user._id }]
    });

    if (valoraciones >= 10) continue;

    const needed = 10 - valoraciones;
    const otherUsers = allUsers.filter(u => u._id.toString() !== user._id.toString());

    // En la función createRatings, modificar el loop de relleno:
    for (let i = 0; i < needed; i++) {
      const targetUser = randomItem(otherUsers);
      const tipo = user.role === 'organizer' ? 'organizador-a-musico' : 'musico-a-organizador';
      
      // Seleccionar una oferta aleatoria existente
      // Modificar la selección de ofertas para incluir solo las relevantes
      const ofertasRelevantes = ofertas.filter(o => 
        o.organizer.equals(user._id) || 
        o.postulaciones.some(p => p.musician.equals(user._id))
      );

      if (ofertasRelevantes.length === 0) continue;
      const ofertaRandom = randomItem(ofertasRelevantes);

      await Rating.create({
        oferta: ofertaRandom._id, // Usar oferta existente
        evaluador: user._id,
        evaluado: targetUser._id,
        calificacion: faker.number.int({ min: 4, max: 5 }),
        comentario: randomItem(comentariosPositivos),
        tipo
      });
      contadorValoraciones++;
    }
  }

  console.log(`✅ Creadas ${contadorValoraciones} valoraciones (mínimo 10 por usuario)`);
}

async function seed() {
  try {
    await connectDB();
    await clearDB();

    const password = await bcrypt.hash("test1234", 10);
    const { organizers, musicians } = await createUsers(password);
    const ofertas = await createOfertas(organizers, musicians);
    await createRatings(ofertas);

    console.log("🎉 Seeding completo con datos realistas en español.");
  } catch (err) {
    console.error("❌ Error durante el seeding:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  }
}

seed();