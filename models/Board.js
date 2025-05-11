const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List'
  }],
  background: {
    type: String,
    default: '#0079BF'
  },
  isPrivate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Board = mongoose.model('Board', boardSchema);

module.exports = Board; 