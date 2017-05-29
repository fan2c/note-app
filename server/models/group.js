var mongoose = require('mongoose');
var moment = require('moment');

var GroupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
    minlength: 1
  },
  member: [{
    name: 'string',
    _id: {type: mongoose.Schema.Types.ObjectId, ref:'User'}
  }],
  _creator : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

GroupSchema.pre('save', function(next) {
  var group = this;
  if (this.isNew) {
    group.member = {"name":"admin","_id":this._creator}
  }
  next();
});

var Group = mongoose.model('Group', GroupSchema);

module.exports = {Group};
