'use strict';
const {Link, Category } = require('./models');
const {router} = require('./router');
const  controller  = require('./linksController');

module.exports = {router, controller};
