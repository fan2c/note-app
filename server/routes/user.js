// user.js
const _ = require('lodash');
var express  = require('express');
var router = express.Router();
var {User} = require('./../models/user');
var passport = require('passport');

// POST /api/users/ API
router.post('/', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);
  var user = new User(body);

  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    res.header('Authorization', token).send(user);
  }).catch((e) => {
    res.status(400).send(e);
  })
});

// GET /api/users/me API
router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.send(req.user);
});

// POST /api/users/login API
router.post('/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('Authorization', token).send(user);
    });
  }).catch((e) => {
    res.status(400).send();
  });
});

// DELETE /api/users/me/token API
router.delete('/me/token', passport.authenticate('jwt', { session: false }), (req, res) => {
  req.user.removeToken(req.user.tokens[0].token).then(() => {
    res.status(200).send();
  }, () => {
    res.status(400).send();
  });
});

module.exports = router;
