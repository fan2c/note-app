const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    lowercase:true,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: value => {return validator.isEmail(value)},
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    require: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['User','Moderator','Administrator'],
    default: 'User'
  },
  birthday: {
    type: String
  },
  groups : [{
    name: 'string',
    _id: {type: mongoose.Schema.Types.ObjectId, ref:'Group'}
  }],
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
});

// Format to JSON syntax
UserSchema.methods.toJSON = function () {
  var user = this;
  var userObject = user.toObject();

  return _.pick(userObject, ['_id', 'email']);
};

// Generate token
UserSchema.methods.generateAuthToken = function () {
  var user = this;
  var access = 'auth';
  var token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

  user.tokens.push({access, token});

  return user.save().then(() => {
    return token;
  });
};

// Remove token
UserSchema.methods.removeToken = function (token) {
  var user = this;

  return user.update({
    $pull: {
      tokens: {token}
    }
  });
};

//Finde user by token
UserSchema.statics.findByToken = function (token) {
  var User = this;
  var decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return Promise.reject();
  }

  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};

// Valid the user
UserSchema.statics.findByCredentials = function (email, password) {
  var User = this;

  return User.findOne({email}).then((user) => {
    if (!user) {
      return Promise.reject();
    }

    return new Promise((resolve, reject) => {
      // Use bcrypt.compare to compare password and user.password
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user);
        } else {
          reject();
        }
      });
    });
  });
};

// Compare password with the stored password
UserSchema.methods.validPassword = function (password) {
  var user = this;

  return bcrypt.compareSync(password, user.password);
};

// Pre-save hashed user's password
UserSchema.pre('save', function (next) {
  var user = this;

  if (user.isModified('password') || this.isNew) {
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(user.password, salt, function (err, hash) {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});


var User = mongoose.model('User', UserSchema);

module.exports = {User}
