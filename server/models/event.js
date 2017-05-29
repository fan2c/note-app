var mongoose = require('mongoose');
var moment = require('moment');

var EventSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    minlength: 1
    // trim: true
  },
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  groupId : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  _creator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});
EventSchema.index({text: 'text'});

var Event = mongoose.model('Event', EventSchema);

module.exports = {Event};
