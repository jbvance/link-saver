'use strict';
const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jwtAuth = passport.authenticate('jwt', { session: false });
const { createLink, getLinks, deleteLink, updateLink } = require('./linksController');
const errorHandlers = require('../errorHandlers');

const jsonParser = bodyParser.json();

const router = express.Router();

router.post('/', jwtAuth, jsonParser, createLink);

router.get('/', jwtAuth, getLinks);

router.delete('/:id', jwtAuth, deleteLink);

router.put('/:id', jwtAuth, jsonParser, errorHandlers.catchErrors(updateLink));

module.exports = {router};
