const explainHeaders = (req, res, next) => {
  // Définition des headers et de leurs cas de valeurs possibles
  const headerSpecs = {
    // Connexion TCP
    connection: {
      default: 'Contrôle la persistance de la connexion TCP.',
      values: {
        'keep-alive':
          'La connexion reste ouverte pour plusieurs requêtes sans ré-établir le TCP.',
        close: 'La connexion sera fermée à la fin de cette requête.',
      },
    },

    // Cache / Validation
    'cache-control': {
      default: 'Politique de cache (client, proxy).',
      values: {
        'no-cache':
          'Le client vérifie la validité en amont avant d’utiliser le cache.',
        'no-store': 'Pas de stockage de la ressource en cache du tout.',
        'max-age':
          'Âge maximal en secondes de la ressource considérée fraîche.',
        'must-revalidate': 'Le cache doit revalider après expiration.',
      },
    },
    pragma: {
      default: 'Ancien contrôle du cache (legacy).',
      values: {
        'no-cache':
          'Demande de ne pas servir de contenu depuis un cache sans revalidation.',
      },
    },
    'if-none-match': {
      default: 'Vérification par ETag; renvoie 304 si inchangé.',
    },
    'if-modified-since': {
      default:
        'Vérification temporelle; renvoie 304 si inchangé depuis la date donnée.',
    },

    // Auth & sécurité
    authorization: {
      default: 'Jeton d’authentification (ex: Bearer <token>, Basic <creds>).',
    },
    cookie: {
      default: 'En-tête de cookies (session, tracking, préférences).',
    },
    'x-forwarded-for': {
      default:
        'Adresse IP réelle du client derrière un proxy ou un load-balancer.',
    },
    origin: {
      default: 'Origine (URL) de la requête; essentiel pour CORS.',
    },
    referer: {
      default: 'Page précédente d’où la requête a été initiée.',
    },

    // Client hints
    'sec-ch-ua': {
      default: 'Client Hint - navigateur et version.',
    },
    'sec-ch-ua-mobile': {
      default: 'Client Hint - mobile ou non (?0 = non, ?1 = oui).',
    },
    'sec-ch-ua-platform': {
      default: 'Client Hint - plateforme (Windows, macOS, Android…).',
    },
    'sec-fetch-site': {
      default: 'Contexte d’origine (same-origin, same-site, cross-site, none).',
      values: {
        'same-origin': 'Même origine (URL identique).',
        'same-site': 'Même site, potentiellement sous-domaine différent.',
        'cross-site': 'Origine complètement différente (risqué).',
        none: 'Requête directe sans contexte d’origine.',
      },
    },
    'sec-fetch-mode': {
      default: 'Mode de la requête (navigate, cors, no-cors, same-origin).',
    },
    'sec-fetch-user': {
      default:
        'Présence action utilisateur (usuellement ?1 = clic, ?0 = pas d’action).',
    },
    'sec-fetch-dest': {
      default:
        'Destination attendue de la ressource (document, script, style…).',
    },

    // Contenu et formats
    'content-type': {
      default:
        'Type MIME du corps de la requête (application/json, multipart/form-data…).',
    },
    accept: {
      default: 'Types MIME que le client accepte (JSON, HTML, images…).',
    },
    'accept-language': {
      default: 'Langues préférées pour la réponse (fr-FR, en-US…).',
    },
    'accept-encoding': {
      default: 'Méthodes de compression acceptées (gzip, br, deflate).',
    },

    // Divers
    host: {
      default: 'Nom d’hôte ou IP de la requête (virtuel ou non).',
    },
    'upgrade-insecure-requests': {
      default: 'Préférence client pour passer en HTTPS (1 = oui).',
      values: { 1: 'Le client souhaite upgrader la requête HTTP vers HTTPS.' },
    },
    'user-agent': {
      default: 'Chaîne d’information sur le navigateur, OS et moteur de rendu.',
    },
  };

  // Parcours et construction du tableau final
  req.parsedHeaders = Object.entries(req.headers).map(([rawKey, rawValue]) => {
    const key = rawKey.toLowerCase();
    const spec = headerSpecs[key];
    const value = Array.isArray(rawValue) ? rawValue.join(', ') : rawValue;
    let meaning = 'Explication indisponible pour ce header.';

    if (spec) {
      // Si on a des cas de valeur précis
      if (spec.values) {
        // on prend la première valeur avant une éventuelle virgule
        const valKey = value.split(',')[0].toLowerCase().trim();
        meaning = spec.values[valKey] || spec.default;
      } else {
        meaning = spec.default;
      }
    }

    return { key, value, meaning };
  });

  next();
};

export { explainHeaders };
