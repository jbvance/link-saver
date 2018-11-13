'use strict';
const express = require('express');
const bodyParser = require('body-parser');

//const {Link} = require('./models');

const router = express.Router();

const jsonParser = bodyParser.json();

// Post to register a new user
router.get('/', (req, res) => {
    return res.status(200).json({
        message: "LINKS GO HERE"
    });
});

module.exports = {router};
