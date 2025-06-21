const express = require('express');
const path = require('path');
const app = express();

const appName = 'sos-garage'; // Corrigé pour correspondre à l'outputPath

// Servir les fichiers statiques de l'application Angular
app.use(express.static(path.join(__dirname, 'dist', appName)));

// Pour toutes les autres requêtes, renvoyer vers le fichier index.html de l'application Angular
// C'est nécessaire pour que le routage côté client d'Angular fonctionne.
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', appName, 'index.html'));
});

// Démarrer le serveur
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
}); 