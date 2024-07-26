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


/**
 * Fonction utilitaire pour retourner une structure de réponse métier
 * @param {*} response 
 * @param {*} code 
 * @param {*} message 
 * @param {*} data 
 * @returns 
 */
function responseService(response, code, message, data) {
  return response.json({ code: code, message: message, data: data });
};

// Middleware
function authMiddleware(request, response, next) {
  // Si token null alors erreur
  if (request.headers.authorization == undefined || !request.headers.authorization) {
    return response.json({ message: "Token null" });
  }

  // Extraire le token (qui est bearer)
  const token = request.headers.authorization.substring(7);

  // par defaut le result est null
  let result = null;

  // Si reussi à générer le token sans crash
  try {
    result = jwt.verify(token, JWT_SECRET);
  } catch {
  }

  // Si result null donc token incorrect
  if (!result) {
    return response.json({ message: "token pas bon" });
  }

  // On passe le middleware
  return next();
}

// MOCK
// Routes
app.get("/articles", async (request, response) => {

  //Select all articles
  const articles = await Article.find();

  // RG-001 200 valid
  return responseService(response, '200', 'La liste des articles a été récupérés avec succès', articles);
});

app.get("/article/:id", async (request, response) => {

  // Il faut l'id en String
  const id = request.params.id;

  // Le code qui retrouve l'article ayant l'attribut id === l'id en param
  const foundArticle = await Article.findOne({uid : id});

  // RG-002 702 Si article inexistant
  if(!foundArticle) {
    return responseService(response, '702', `Impossible derécupérer un article avec l'UID ${id}`, null);
  }

  // RG-002 200 valid
  return responseService(response, '200', 'Article récupéré avec succès', foundArticle);

});

app.post("/save-article", authMiddleware, async (request, response) => {
  // Récupérer l'article envoyé en json
  const articleJSON = request.body;

  // TODO : Controle de surface (valider les données)

  let foundArticle = null;
  //----------------------------
  // EDITION RG-004
  //----------------------------
  // Est-ce on a un id envoyer dans le json
  if (articleJSON.id != undefined || articleJSON.id) {
    // Si il existe déjà
    const articleBytitle = await Article.findOne({ title : articleJSON.title, uid : { $ne : articleJSON.id}});
    if (articleBytitle) {
      return responseService(response, '701', `Impossible d'ajouter un article avec un titre déjà existant`, null)
    }

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
  // CREATION RG-003
  //----------------------------

  // RG-003 (701) Tester que le titre n'exoste pas en base
  const articleBytitle = await Article.findOne({ title : articleJSON.title });
  if (articleBytitle) {
    return responseService(response, '701', `Impossible d'ajouter un article avec un titre déjà existant`, null);
  }

  // Instancier un article Mongo
  const createArticle = await Article.create(articleJSON);

  // Générer un id
  createArticle.uid = uuidv4();

  // Sauvegarder en base
  await createArticle.save();

  // succès (200)
  return responseService(response, '200', `Article crée avec succès !`, createArticle);
});

app.delete("/article/:id", authMiddleware,  async (request, response) => {
  // Il faut l'id en entier
  const id = request.params.id;

  // trouver un article
  const foundArticle = await Article.findOne({ uid : id});

  // si article trouve erreur
  if (!foundArticle) {
    // RG-005 echec (702)
    return responseService(response, '702', `Impossible de supprimer un article dont l'UID n'existe pas`, null);
  }

  // supprimer grace à l'index
  await foundArticle.deleteOne();

  // succès (200)
  return responseService(response, '200', `L'article ${id} a été supprimé avec succès`, foundArticle);
});

// Démarrer le serveur
app.listen(3000, () => {
  console.log(`Le serveur à démarré`);
});

// test pour l'école //