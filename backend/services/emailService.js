// services/emailService.js
const transporter = require('../config/emailConfig');
const templates = require('../utils/emailTemplates');

const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const emailContent = templates.welcomeEmail(userName);
    
    await transporter.sendMail({
      from: `"EscenArte" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: emailContent.subject,
      html: emailContent.html
    });
    
    console.log(`Email de bienvenida enviado a ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Error al enviar email de bienvenida:', error);
    return false;
  }
};

module.exports = { sendWelcomeEmail };