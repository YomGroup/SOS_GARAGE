const express = require('express');
const path = require('path');
const app = express();

const appName = 'sos-garage';

// Le chemin vers le dossier contenant les fichiers statiques du build Angular
const staticFilesPath = path.join(__dirname, 'dist', appName, 'browser');

// Servir les fichiers statiques de l'application Angular
app.use(express.static(staticFilesPath));

// Pour toutes les autres requêtes, renvoyer vers le fichier index.html de l'application Angular
app.get('/*', (req, res) => {
    res.sendFile(path.join(staticFilesPath, 'index.html'));
});

// Démarrer le serveur
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
}); 