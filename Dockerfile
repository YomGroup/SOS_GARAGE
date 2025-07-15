# Etape 1: Compilation de l'application Angular
FROM node:18 as build

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances et les installer
COPY package.json package-lock.json ./
RUN npm install

# Copier le reste du code de l'application
COPY . .

# Compiler l'application pour la production
RUN npm run build

# Etape 2: Création de l'image de production légère
FROM node:18-slim

WORKDIR /app

# Copier uniquement les dépendances de production
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copier le serveur Express
COPY server.js .

# Copier l'application compilée depuis l'étape de build
COPY --from=build /app/dist/sos-garage/ ./dist/sos-garage/

# Exposer le port sur lequel le serveur tourne
EXPOSE 8080

# La commande pour démarrer le serveur
CMD ["node", "server.js"] 