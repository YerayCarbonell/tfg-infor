// utils/emailTemplates.js

const welcomeEmail = (userName) => {
    return {
      subject: '🎉 Bienvenido a EscenArte',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #4A90E2;">
            <span style="color: #4A90E2;">Escen</span><span style="color: rgb(44, 44, 44);">Arte</span>
          </h1>
  
          <h2 style="margin-top: 0;">¡Hola ${userName}!</h2>
  
          <p>Gracias por unirte a <strong>EscenArte</strong>, la plataforma donde artistas y organizadores se conectan para crear experiencias inolvidables.</p>
  
          <p>A partir de ahora podrás:</p>
          <ul>
            <li>Crear y gestionar tu perfil profesional</li>
            <li>Publicar o descubrir nuevas oportunidades musicales</li>
            <li>Conectar directamente con artistas, espacios y eventos</li>
          </ul>
  
          <p>Ya puedes acceder a tu panel desde aquí:</p>
          <p style="text-align: center;">
            <a href="http://localhost:8081/profile" style="display: inline-block; background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Ir a mi perfil
            </a>
          </p>
  
          <p>Si tienes cualquier duda, estaremos encantados de ayudarte.</p>
  
          <p style="margin-top: 40px;">🎵 ¡Bienvenido a la comunidad EscenArte!</p>
          <p>— El equipo de EscenArte</p>
        </div>
      `
    };
  };
  
  module.exports = { welcomeEmail };
  