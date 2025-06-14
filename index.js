// app.js
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connection = require('express-myconnection');
const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config();


const routes = require('./routes');
const dbConfig = require('./config/database');
const { middleware } = require('./middlewares/headerAnalysis');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(connection(mysql, dbConfig, 'pool'));

app.set('view engine', 'ejs');
app.set('views', 'composants');

// Middleware pour analyser les headers
app.use(middleware);

// Routes
app.use('/', routes);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Serveur écoute sur le port ${port}`);
});
