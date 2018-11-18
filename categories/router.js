'use strict';
const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jwtAuth = passport.authenticate('jwt', { session: false });
const { createCategory, getCategories, deleteCategory, updateCategory } = require('./categoriesController');
const { catchErrors } = require('../errorHandlers');

const jsonParser = bodyParser.json();

const router = express.Router();

router.post('/', jwtAuth, jsonParser, catchErrors(createCategory));

router.get('/', jwtAuth, catchErrors(getCategories));

router.delete('/:id', jwtAuth, catchErrors(deleteCategory));

router.put('/:id', jwtAuth, jsonParser, catchErrors(updateCategory));

module.exports = {router};