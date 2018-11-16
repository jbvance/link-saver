'use strict';
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const LinkSchema = mongoose.Schema({
  href: {
    type: String,
    required: true,    
  },
  title: {
      type: String,
      default: 'New Link'
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User',
    required: true
  },

  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

  favIcon: {
    type: String,   
  }, 
}, {timestamps: true });

const CategorySchema = mongoose.Schema({
    name: {
      type: String,
      required: true, 
      lowercase: true   
    },   
    userId: { type: mongoose.Schema.Types.ObjectId, 
              ref: 'User',
              required: true 
            }
  }, { timestamps: true });


const Link = mongoose.model('Link', LinkSchema);
const Category = mongoose.model('Category', CategorySchema);



module.exports = {Link, Category};