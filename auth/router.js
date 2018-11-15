'use strict';
const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const config = require('../config');
const router = express.Router();

const createAuthToken = function(user) {
  return jwt.sign({user}, config.JWT_SECRET, {
    subject: user.username,
    expiresIn: config.JWT_EXPIRY,
    algorithm: 'HS256'
  });
};

const localAuth = passport.authenticate('local', {session: false});
// parse application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: false })) 
// parse application/json
router.use(bodyParser.json());

// The user provides a username and password to login
router.post('/login', localAuth, (req, res) => {  
  const authToken = createAuthToken(req.user.serialize());
  //create a cookie so it can be sent in subsequent requests from a browser
  res.cookie('jwt',authToken);
 
  res.json({authToken});
});



const jwtAuth = passport.authenticate('jwt', {session: false});

// The user exchanges a valid JWT for a new one with a later expiration
router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({authToken});
});

module.exports = {router};
