const express = require("express");

// Instancier l'app serveur
const app = express();

// Simulation de données en mémoire
let DB_articles = [
  {
    id: 1,
    title: "Premier article",
    content: "Contenu du premier article",
    author: "Isaac",
  },
  {
    id: 2,
    title: "Deuxième article",
    content: "Contenu du deuxième article",
    author: "Sanchez",
  },
  {
    id: 3,
    title: "Troisième article",
    content: "Contenu du troisième article",
    author: "Toto",
  },
  {
    id: 4,
    title: "Quatrième article",
    content: "Contenu du Quatrième article",
    author: "Streum",
  },
];

app.use(express.json());
// Déclarer des routes
app.get("/articles", (request, response) => {
  return response.json(DB_articles);
});

app.get("/article/:id", (request, response) => {
  const id = parseInt(request.params.id);
  const article = DB_articles.find((article) => article.id === id);

  if (article) {
    return response.json(article);
  } else {
    return response.json("Article non trouvé");
  }
});

app.post("/save-article", (request, response) => {
  DB_articles.push(request.body);

  // Si je trouve je le modifie
  const articleJSON = request.body;

  //Sinon je créer

  return response.json(DB_articles);
});

app.delete("/article/:id", (request, response) => {
  const id = parseInt(request.params.id);
  const article = DB_articles.find((article) => article.id === id);

  if (article) {
    DB_articles.splice(id);
    console.log(id);
    return response.json(`Article ${id} supprimé avec succès`);
  }
  // else {
  // return response.json("Article non trouvé");
  // }
});

// Démarrer
// Param 1 = Le port ou on lance le serveur
// Param 2 = Que faire quand le serveur à démarrer (affiche un log)
app.listen(3000, () => {
  console.log("Le serveur à démarré");
});
