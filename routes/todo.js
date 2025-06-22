const express = require('express');
const router = express.Router();
const {
  analyzeHeaders,
  HEADER_CATEGORIES,
  middleware,
  analyzeRequestHeaders,
} = require('../middlewares/headerAnalysis');

// ✅ GET ALL
router.get('/', (req, res) => {
  req.getConnection((err, connection) => {
    if (err) return res.status(500).json({ error: err });

    connection.query('SELECT * FROM Todo', [], (err, result) => {
      if (err) return res.status(500).send({ error: err });

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
      const responseReport = analyzeHeaders(
        res.getHeaders(),
        HEADER_CATEGORIES
      );

      res.status(200).json({
        todos: result,
        methods,
        protocol,
        host,
        status,
        url,
        requestReport,
        responseReport,
        headers: req.parsedHeaders,
      });
    });
  });
});

// ✅ ADD TODO
router.post('/', (req, res) => {
  const { name, isFinished } = req.body;

  req.getConnection((err, connection) => {
    if (err) return res.status(500).send('Erreur serveur');

    connection.query(
      'INSERT INTO Todo (name,isFinished) VALUES (?,?)',
      [name, isFinished],
      (err, result) => {
        if (err) return res.status(500).send({ error: err });

        const insertedId = result.insertId;

        connection.query(
          'SELECT * FROM Todo WHERE id = ?',
          [insertedId],
          (err, rows) => {
            if (err)
              return res.status(500).send('Erreur lors de la récupération');

            const todo = rows[0];
            // Headers sécurisés
            res.set({
              'Strict-Transport-Security':
                'max-age=31536000; includeSubDomains',
              'Content-Security-Policy':
                "default-src 'self'; script-src 'none';",
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
            const responseReport = analyzeHeaders(
              res.getHeaders(),
              HEADER_CATEGORIES
            );

            // Affiche la page d'analyse pour POST après insertion
            res.status(201).json({
              todo,
              methods,
              protocol,
              host,
              status,
              url,
              requestReport,
              responseReport,
              headers: req.parsedHeaders,
            });
          }
        );
      }
    );
  });
});

// ✅ UPDATE TODO
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, isFinished } = req.body;

  req.getConnection((err, connection) => {
    if (err) return res.status(500).send('Erreur serveur');

    const query = `
      UPDATE Todo 
      SET name = ?, isFinished = ?
      WHERE id = ?
    `;

    connection.query(query, [name, isFinished, id], (err, result) => {
      if (err)
        return res.status(500).json({ error: 'Erreur lors de la mise à jour' });

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Todo non trouvé' });
      }

      const selectQuery = `SELECT * FROM Todo WHERE id = ?`;

      connection.query(selectQuery, [id], (err, rows) => {
        if (err)
          return res
            .status(500)
            .json({ error: 'Erreur lors de la récupération du todo' });

        // Analyse requête POST + réponse
        const methods = req.method;
        const protocol = req.protocol;
        const host = req.get('host');
        const status = res.statusCode;
        const url = req.originalUrl;
        const requestReport = analyzeRequestHeaders(req.headers);
        const responseReport = analyzeHeaders(
          res.getHeaders(),
          HEADER_CATEGORIES
        );

        res.status(200).json({
          todo: rows[0],
          methods,
          protocol,
          host,
          status,
          url,
          requestReport,
          responseReport,
          headers: req.parsedHeaders,
        });
      });
    });
  });
});

// ✅ DELETE TODO
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  req.getConnection((err, connection) => {
    if (err) return res.status(500).send('Erreur serveur');

    connection.query('DELETE FROM Todo WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).send('Erreur de suppression');

      // Analyse requête POST + réponse
      const methods = req.method;
      const protocol = req.protocol;
      const host = req.get('host');
      const status = res.statusCode;
      const url = req.originalUrl;
      const requestReport = analyzeRequestHeaders(req.headers);
      const responseReport = analyzeHeaders(
        res.getHeaders(),
        HEADER_CATEGORIES
      );

      res.status(200).json({
        deleted: true,
        methods,
        protocol,
        host,
        status,
        url,
        requestReport,
        responseReport,
        headers: req.parsedHeaders,
      });
    });
  });
});

module.exports = router;
