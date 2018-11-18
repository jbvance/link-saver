'use strict';
const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jwtAuth = passport.authenticate('jwt', { session: false });
const { createCategory, getCategories, deleteCategory, updateCategory } = require('./categoriesController');
const errorHandlers = require('../errorHandlers');

const jsonParser = bodyParser.json();

const router = express.Router();

router.post('/', jwtAuth, jsonParser, errorHandlers.catchErrors(createCategory));

router.get('/', jwtAuth, errorHandlers.catchErrors(getCategories));

router.delete('/:id', jwtAuth, errorHandlers.catchErrors(deleteCategory));

router.put('/:id', jwtAuth, jsonParser, errorHandlers.catchErrors(updateCategory));

module.exports = {router};