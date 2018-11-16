'use strict';
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');

const { router: usersRouter } = require('./users');
const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');
const { router: linksRouter, controller: linksController } = require('./links');

mongoose.Promise = global.Promise;

let { PORT, DATABASE_URL } = require('./config');
if (process.env.NODE_ENV === 'test') {
  DATABASE_URL = "mongodb://localhost/jwt-auth-demo";
}

//console.log("DATBASE_URL", DATABASE_URL);

const app = express();

// static assets
app.use(express.static('public'));

// Logging
app.use(morgan('common'));

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

// A protected endpoint which needs a valid JWT to access it
app.get('/api/protected', jwtAuth, (req, res) => {
  return res.json({
    data: 'rosebud'
  });
});

// This is the GET route for when a user preprends the app's domain to the url to bookmark (along with a possible category name)
// This route takes the url path and creates the link, along with a category if supplied by category-name--
app.get(/^\/([a-zA-Z0-9]{0,}-[a-zA-Z0-9]*){0,}(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+){0,}\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/ , jwtAuth, linksController.createLink);

app.use('*', (req, res) => {
  return res.status(404).json({ message: 'Not Found' });
});

// Referenced by both runServer and closeServer. closeServer
// assumes runServer has run and set `server` to a server object
let server;

function runServer() {
  return new Promise((resolve, reject) => {
    /*************************************************
     * POSTGRES SPECIFIC STUFF
     ************************************************/

    
    // const sequelize = new Sequelize(process.env.PG_DB_NAME, process.env.PG_DB_USER, process.env.PG_DB_PASSWORD, {
    //   host: process.env.PG_DB_HOST,
    //   dialect: 'postgres',
    //   "ssl": true,
    //   "dialectOptions": {
    //       "ssl": true
    //   },
    //   operatorsAliases: false,
    
    //   pool: {
    //     max: 5,
    //     min: 0,
    //     acquire: 30000,
    //     idle: 10000
    //   },
    // });
    // const User = sequelize.define('user', {
    //   firstName: {
    //     type: Sequelize.STRING
    //   },
    //   lastName: {
    //     type: Sequelize.STRING
    //   }
    // });
    
    // // force: true will drop the table if it already exists
    // User.sync({force: true}).then(() => {
    //   // Table created
    //   return User.create({
    //     firstName: 'John',
    //     lastName: 'Hancock'
    //   });
    // });

     /**END OF POSTGRES SPECIFIC STUFF */

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
