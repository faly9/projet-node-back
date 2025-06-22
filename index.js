// app.js
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connection = require('express-myconnection');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const frontendUri = process.env.FRONTEND_URI;

const todoRoutes = require('./routes/todo');
const dbConfig = require('./config/database');

const { middleware } = require('./middlewares/headerAnalysis');
const { explainHeaders } = require('./middlewares/header.middleware');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: [frontendUri],
    credentials: true,
    preflightContinue: false,
    allowedHeaders: ['sessionId', 'Content-Type'],
    exposedHeaders: ['sessionId'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

app.use(connection(mysql, dbConfig, 'pool'));

app.set('view engine', 'ejs');
app.set('views', 'composants');

// Middleware pour analyser les headers
app.use(middleware);
app.use(explainHeaders);

// TODO ROUTES
app.use('/api/todo', todoRoutes);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Serveur écoute sur le port ${port}`);
});
