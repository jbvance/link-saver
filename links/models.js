'use strict';
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const LinkSchema = mongoose.Schema({
  url: {
    type: String,
    required: true, 
  },
  title: {
      type: String,
      required: true,
      default: 'New Link'
  },

  user: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User',
    required: true
  },

  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category',     
  },

  favIcon: {
    type: String,   
  }, 

  note: {
    type: String,
    trim: true
  }
}, {timestamps: true });

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


const Link = mongoose.model('Link', LinkSchema);

module.exports = {Link};