const express = require('express');
const router = express.Router();
const {
  analyzeHeaders,
  HEADER_CATEGORIES,
  middleware,
  analyzeRequestHeaders
} = require('../middlewares/headerAnalysis');

// ✅ Middleware global pour analyser chaque requête
router.use(middleware);

// ✅ Page de redirection
router.get('/', (req, res) => {
  res.status(200).render('redirection');
});

// ✅ Page d'accueil : affiche la liste + analyse de la requête GET
router.get('/accueil', (req, res) => {
  req.getConnection((err, connection) => {
    if (err) return res.status(500).send('Erreur serveur');

    connection.query('SELECT * FROM liste', [], (err, resultat) => {
      if (err) return res.status(500).send('Erreur de requête');

      // Headers sécurisés
      res.set({
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'none';",
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
      });

      // Analyse requête et réponse
      const methods = req.method;
      const protocol = req.protocol;
      const host = req.get('host');
      const status = res.statusCode;
      const url = req.originalUrl;
      const requestReport = analyzeRequestHeaders(req.headers);
      const responseReport = analyzeHeaders(res.getHeaders(), HEADER_CATEGORIES);

      res.status(200).render('index', {
        methods,
        protocol,
        host,
        status,
        url,
        resultat,
        requestReport,
        responseReport
      });
    });
  });
});

// ✅ GET : Page pour afficher le formulaire d'ajout
router.get('/ajouter', (req, res) => {
  res.render('ajouter', {
    methods: null,
    protocol: null,
    host: null,
    status: null,
    url: null,
    requestReport: null,
    responseReport: null
  });
});

// ✅ POST : Insertion + affiche l'analyse POST
router.post('/ajouter', (req, res) => {
  const { text } = req.body;

  req.getConnection((err, connection) => {
    if (err) return res.status(500).send('Erreur serveur');

    connection.query('INSERT INTO liste (texte) VALUES (?)', [text], (err) => {
      if (err) return res.status(500).send("Erreur d'insertion");

      // Headers sécurisés
      res.set({
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'none';",
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
      });

      // Analyse requête POST + réponse
      const methods = req.method;
      const protocol = req.protocol;
      const host = req.get('host');
      const status = res.statusCode;
      const url = req.originalUrl;
      const requestReport = analyzeRequestHeaders(req.headers);
      const responseReport = analyzeHeaders(res.getHeaders(), HEADER_CATEGORIES);

      // Affiche la page d'analyse pour POST après insertion
      res.status(200).render('ajouter', {
        methods,
        protocol,
        host,
        status,
        url,
        requestReport,
        responseReport
      });
    });
  });
});

// ✅ POST : Suppression
router.post('/delete/:id', (req, res) => {
  const { id } = req.params;

  req.getConnection((err, connection) => {
    if (err) return res.status(500).send('Erreur serveur');

    connection.query('DELETE FROM liste WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).send("Erreur de suppression");

      res.redirect('/accueil'); // Après suppression → retour à l'accueil
    });
  });
});

module.exports = router;
