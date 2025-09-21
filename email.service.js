

require('dotenv').config();
const sgMail = require('@sendgrid/mail');

// Configurez SendGrid avec votre clé API
const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  console.error('Erreur: La clé API SendGrid n\'est pas définie. Vérifiez votre fichier .env');
} else {
  sgMail.setApiKey(apiKey);
  console.log('Service Email initialisé avec succès.');
}

/**
 * Envoie un e-mail en utilisant SendGrid.
 * @param {object} options - Les options de l'e-mail.
 * @param {string} options.to - L'adresse e-mail du destinataire.
 * @param {string} options.subject - Le sujet de l'e-mail.
 * @param {string} options.text - Le corps de l'e-mail en texte brut.
 * @param {string} options.html - Le corps de l'e-mail en HTML.
 */
async function sendEmail({ to, subject, text, html }) {
  if (!apiKey) {
    console.error("Impossible d'envoyer l'e-mail : la clé API SendGrid n'est pas configurée.");
    return; // Ne tente pas d'envoyer si la clé n'est pas là
  }

  const msg = {
    to,
    from: 'noreply@sos-garage.com', // IMPORTANT : Remplacez par votre adresse e-mail vérifiée sur SendGrid
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email envoyé avec succès à ${to}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'e-mail:", error);

    if (error.response) {
      console.error(error.response.body);
    }
  }
}

module.exports = { sendEmail };

