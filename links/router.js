'use strict';
const express = require('express');
const passport = require('passport');
const jwtAuth = passport.authenticate('jwt', { session: false });
const { getLinks } = require('./linksController');

//const {Link} = require('./models');

const router = express.Router();

router.get('/', jwtAuth, getLinks);

module.exports = {router};
