'use strict';
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const CategorySchema = mongoose.Schema({
    name: {
      type: String,
      required: true, 
      lowercase: true   
    },   
    user: { type: mongoose.Schema.Types.ObjectId, 
              ref: 'User',
              required: true 
            }
  }, { timestamps: true });


const Category = mongoose.model('Category', CategorySchema);

module.exports = {Category};
