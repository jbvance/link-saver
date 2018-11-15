'use strict';
const express = require('express');
const passport = require('passport');
const jwtAuth = passport.authenticate('jwt', { session: false });
const { getLinks, deleteLink } = require('./linksController');

//const {Link} = require('./models');

const router = express.Router();

router.get('/', jwtAuth, getLinks);

router.delete('/:id', jwtAuth, deleteLink);

module.exports = {router};
