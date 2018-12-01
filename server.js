'use strict';
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const enforce = require('express-sslify');
const path = require('path');
const errorHandlers = require('./errorHandlers');

const { router: usersRouter } = require('./users');
const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');
const { router: linksRouter, controller: linksController } = require('./links');
const { router: categoriesRouter, controller: categoriesController } = require('./categories');

mongoose.Promise = global.Promise;

let { PORT, DATABASE_URL } = require('./config');
if (process.env.NODE_ENV === 'test') {
  DATABASE_URL = "mongodb://localhost/jwt-auth-demo";
}

//console.log("DATBASE_URL", DATABASE_URL);

const app = express();

// force ssl in production
if (process.env.NODE_ENV === 'production') {
  app.use(enforce.HTTPS({ trustProtoHeader: true }))
}

// static assets
app.use(express.static('public'));

// Logging
app.use(morgan('common'));

// parse cookies
app.use(cookieParser());

// CORS
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (req.method === 'OPTIONS') {
    return res.send(204);
  }
  next();
});

const jwtAuth = passport.authenticate('jwt', { session: false });

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/api/users/', usersRouter);
app.use('/api/auth/', authRouter);
app.use('/api/links', linksRouter);
app.use('/api/categories', categoriesRouter);

// demo route
app.get('/demo', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/demo.html'));
});

//protected route
app.get('/api/protected', jwtAuth, (req, res) => {
  res.json({data: 'rosebud'})
})

// This is the GET route for when a user preprends the app's domain to the url to bookmark (along with a possible category name)
// This route takes the url path and creates the link, along with a category if supplied by category-name--
//app.get(/^\/([a-zA-Z0-9]{0,}-[a-zA-Z0-9]*){0,}(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+){0,}\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/ , jwtAuth, linksController.createLink);
app.get(/^\/([a-zA-Z0-9]{0,}-[a-zA-Z0-9]*){0,}(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+){0,}\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/ , (req, res) => {
  console.log("URL", req.originalUrl);
  //res.sendFile(path.join(__dirname + '/public/index.html?test=test'));
  res.redirect('/?saveLink=' + req.originalUrl);
});

app.use('*', (req, res) => {
  return res.status(404).json({ message: 'Not Found' });
});

// Otherwise this was a really bad error we didn't expect! Shoot eh
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {  
  /* Development Error Handler - Prints stack trace */
  app.use(errorHandlers.developmentErrors);
}

// production error handler
app.use(errorHandlers.productionErrors);

// Referenced by both runServer and closeServer. closeServer
// assumes runServer has run and set `server` to a server object
let server;

function runServer() {
  return new Promise((resolve, reject) => {

    mongoose.connect(DATABASE_URL, { useMongoClient: true }, err => {
      if (err) {
        return reject(err);
      }
      server = app
        .listen(PORT, () => {
          console.log(`Your app is listening on port ${PORT}`);
          resolve();
        })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
