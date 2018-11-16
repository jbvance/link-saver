'use strict';
const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jwtAuth = passport.authenticate('jwt', { session: false });
const { createLink, getLinks, deleteLink } = require('./linksController');

const jsonParser = bodyParser.json();

//const {Link} = require('./models');

const router = express.Router();

router.post('/', jwtAuth, jsonParser, createLink);

router.get('/', jwtAuth, getLinks);

router.delete('/:id', jwtAuth, deleteLink);

module.exports = {router};
