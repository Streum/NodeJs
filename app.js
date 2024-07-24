// Importer express
const express = require('express');
const { v4: uuidv4 } = require('uuid')

// Instancier les serveur
const app = express();

// Autoriser express à recevoir des donnée envoyer en JSOn dans le body (Le fameux Payload)
app.use(express.json());

// ================BDD================ //
// Importer mongoose
const mongoose = require('mongoose');

// Ecouter quand la connexion success
mongoose.connection.once('open', () => {
  console.log(`Connecté à la base de donnée`);
});

// Ecouter quand la connexion plante
mongoose.connection.on('error', (err) => {
  console.log(`Erreur de base de donnée : ${err}`);
});

// Se connecter à mongo db
mongoose.connect("mongodb://localhost:27017/db_article");

// Déclarer le modele Article
// 1 : Nom pour les relations dans le code JS (on utilise pas pour le moment)
// 2 : Les attributs attendus pour ce Model (title, content, author)
// 3 : Le nom de la collection en base liée (synomyme du nom de la table en sql)
const Article = mongoose.model('Article', { uid: String, title: String, content: String, author: String}, 'articles');

// ================BDD================ //

// MOCK
// Routes
app.get("/articles", async (request, response) => {

  //Select all articles
  const articles = await Article.find();

  return response.json(articles);
});

app.get("/article/:id", async (request, response) => {

  // Il faut l'id en String
  const id = request.params.id;

  // Le code qui retrouve l'article ayant l'attribut id === l'id en param
  const foundArticle = await Article.findOne({uid : id});

  return response.json(foundArticle);
});

app.post("/save-article", async (request, response) => {
  // Récupérer l'article envoyé en json
  const articleJSON = request.body;

  // TODO : Controle de surface (valider les données)

  let foundArticle = null;
  //----------------------------
  // EDITION
  //----------------------------
  // Est-ce on a un id envoyer dans le json
  if (articleJSON.id != undefined || articleJSON.id) {
    // essayer de trouver un article existant
    foundArticle = await Article.findOne({uid : articleJSON.id});
  
    // Si je trouve pas l'article à modifier
    if (!foundArticle) {
      return response.json(`Impossible de modifié un article inexistant`);
    }

    // Mettre à jour les attributs
    foundArticle.title = articleJSON.title;
    foundArticle.content = articleJSON.content;
    foundArticle.author = articleJSON.author;

    // Sauvegarder en base
    await foundArticle.save();

    // Retourner message succès
    return response.json(`L'article a été modifié avec succès`);
  }
  //----------------------------
  // CREATION
  //----------------------------
  // Instancier un article Mongo
  const createArticle = await Article.create(articleJSON);

  // Générer un id
  createArticle.uid = uuidv4();

  // Sauvegarder en base
  await createArticle.save();

  return response.json(`Article crée avec succès !`);
});

app.delete("/article/:id", async (request, response) => {
  // Il faut l'id en entier
  const id = request.params.id;

  // trouver un article
  const foundArticle = await Article.findOne({ uid : id});

  // si article trouve erreur
  if (!foundArticle) {
    return response.json(`Impossible de supprimer un article inexistant`);
  }

  // supprimer grace à l'index
  await foundArticle.deleteOne();

  return response.json(`Article supprimé ${id}`);
});

// Démarrer le serveur
app.listen(3000, () => {
  console.log(`Le serveur à démarré`);
});

// test pour l'école //