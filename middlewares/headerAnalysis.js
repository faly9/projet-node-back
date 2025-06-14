// middlewares/headerAnalysis.js
const HEADER_CATEGORIES = {
  security: {
    'strict-transport-security': 'Force HTTPS (HSTS)',
    'content-security-policy': 'Politique de sécurité du contenu (CSP)',
    'x-content-type-options': 'Empêche sniffing MIME',
    'x-frame-options': 'Protection clickjacking',
    'referrer-policy': 'Politique d’envoi du referer',
    'permissions-policy': 'Permissions spécifiques (caméra, micro, etc.)',
    'expect-ct': 'Attente de certificat CT',
    'feature-policy': 'Politique de fonctionnalités (ancien)',
  },
  cache: {
    'cache-control': 'Contrôle du cache',
    'expires': 'Expiration',
    'pragma': 'Contrôle du cache HTTP 1.0',
    'etag': 'Validation conditionnelle',
    'last-modified': 'Date de dernière modification',
  },
  cors: {
    'access-control-allow-origin': 'Origines autorisées (CORS)',
    'access-control-allow-methods': 'Méthodes autorisées (CORS)',
    'access-control-allow-headers': 'Headers autorisés (CORS)',
    'access-control-max-age': 'Durée de mise en cache CORS',
  },
  content: {
    'content-type': 'Type MIME',
    'content-length': 'Longueur du contenu',
    'content-encoding': 'Encodage du contenu',
  },
  others: {
    'server': 'Information sur le serveur',
    'via': 'Proxy ou intermédiaire',
    'x-powered-by': 'Technologie utilisée',
  }
};

// Normalisation des noms de headers
function normalizeHeaders(headers) {
  const normalized = {};
  for (const key in headers) {
    if (Object.prototype.hasOwnProperty.call(headers, key)) {
      normalized[key.toLowerCase()] = headers[key];
    }
  }
  return normalized;
}

function analyzeHeaders(headers, categoryMap) {
  const normalizedHeaders = normalizeHeaders(headers);
  const report = {};
  for (const [category, headersList] of Object.entries(categoryMap)) {
    report[category] = {};
    for (const headerName of Object.keys(headersList)) {
      const value = normalizedHeaders[headerName];
      if (value) {
        report[category][headerName] = {
          value,
          status: 'présent',
          recommandation: null
        };

        if (category === 'security') {
          if (headerName === 'strict-transport-security' && !value.includes('max-age')) {
            report[category][headerName].status = 'attention';
            report[category][headerName].recommandation = 'Définir un max-age adapté (ex: 31536000)';
          }
          if (headerName === 'content-security-policy' && value.trim() === '') {
            report[category][headerName].status = 'alerte';
            report[category][headerName].recommandation = 'Définir une politique CSP restrictive';
          }
        }

        if (category === 'cache') {
          if (headerName === 'cache-control' && value.includes('no-store')) {
            report[category][headerName].status = 'sécurisé';
          }
        }
      } else {
        report[category][headerName] = {
          value: null,
          status: 'absent',
          recommandation: 'Ajouter ce header pour améliorer la sécurité : ' + headersList[headerName]
        };
      }
    }
  }
  return report;
}

function analyzeRequestHeaders(headers) {
  const report = {};

  for (const category in REQUEST_HEADER_CATEGORIES) {
    report[category] = {};
    for (const headerName in REQUEST_HEADER_CATEGORIES[category]) {
      const lowerHeader = headerName.toLowerCase();
      const headerValue = headers[lowerHeader] || null;

      if (headerValue) {
        report[category][lowerHeader] = {
          value: headerValue,
          status: "présent",
          description: REQUEST_HEADER_CATEGORIES[category][headerName]
        };
      } else {
        report[category][lowerHeader] = {
          value: null,
          status: "absent",
          description: REQUEST_HEADER_CATEGORIES[category][headerName]
        };
      }
    }
  }

  return report;
}

const REQUEST_HEADER_CATEGORIES = {
  authentication: {
    "Authorization": "Contient les identifiants d’authentification (ex : Bearer token, Basic auth)",
    "Proxy-Authorization": "Authentification pour proxy intermédiaire"
  },
  client: {
    "User-Agent": "Chaîne qui identifie le navigateur ou client HTTP",
    "From": "Adresse e-mail de l’utilisateur (rarement utilisée)",
    "Referer": "Page précédente ayant déclenché la requête",
    "Origin": "Origine de la requête (utile pour CORS)"
  },
  content: {
    "Content-Type": "Type MIME des données envoyées dans la requête",
    "Content-Length": "Longueur en octets du corps de la requête",
    "Content-Encoding": "Type d'encodage utilisé sur le corps de la requête"
  },
  caching: {
    "If-Modified-Since": "Utilisé pour valider le cache avec la date de modification",
    "If-None-Match": "Utilisé avec l’ETag pour valider le cache" 
  },
  security: {
    "Cookie": "Envoie les cookies associés au domaine",
    "X-CSRF-Token": "Protection contre les attaques CSRF (si défini)",
    "DNT": "Indique si l’utilisateur ne souhaite pas être pisté (Do Not Track)"
  },
  networking: {
    "Host": "Nom de domaine et port du serveur ciblé",
    "X-Forwarded-For": "Adresse IP d’origine du client si proxy",
    "Connection": "Contrôle la gestion de la connexion TCP (ex: keep-alive)"
  },
};


function middleware(req, res, next) {
  // 1️⃣ Analyse immédiate de la requête
  req.requestReport = analyzeRequestHeaders(req.headers);

  // 2️⃣ Préparation pour capturer la réponse
  const chunks = [];
  const { write, end } = res;

  res.write = function (chunk, ...args) {
    if (chunk) chunks.push(Buffer.from(chunk));
    return write.apply(res, [chunk, ...args]);
  };

  res.end = function (chunk, ...args) {
    if (chunk) chunks.push(Buffer.from(chunk));

    // 3️⃣ Analyse finale des headers de réponse
    res.responseReport = analyzeHeaders(res.getHeaders(), HEADER_CATEGORIES);

    return end.apply(res, [chunk, ...args]);
  };

  // 4️⃣ Poursuivre le pipeline
  next();
}

module.exports = {
  analyzeHeaders,
  HEADER_CATEGORIES,
  middleware,
  analyzeRequestHeaders,
  REQUEST_HEADER_CATEGORIES

};
