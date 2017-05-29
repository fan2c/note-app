//note.js
const _ = require('lodash');
var express  = require('express');
var router = express.Router();
var {Note} = require('./../models/note');
var moment = require('moment');
const {ObjectID} = require('mongodb');
var passport = require('passport');

// GET /api/notes API
router.get('/',passport.authenticate('jwt', { session: false }), (req, res) => {
  Note.find({
    _creator: req.user._id
  }).then((notes) => {
    res.send({notes});
  }, (e) => {
    res.status(400).send(e);
  });
});

// POST /api/notes API
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  var note = new Note({
    text: req.body.text,
    _creator: req.user._id,
    completedAt: moment().valueOf()
  });

  note.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});

// GET /api/notes/:id API
router.get('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Note.findOne({
    _id: id,
    _creator: req.user._id
  }).then((note) => {
    if (!note) {
      return res.status(404).send();
    }

    res.send({note});
  }).catch((e) => {
    res.status(400).send();
  });
});

// DELETE /api/notes/:id API
router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Note.findOneAndRemove({
    _id: id,
    _creator: req.user._id
  }).then((note) => {
    if (!note) {
      return res.status(404).send();
    }

    res.send({note});
  }).catch((e) => {
    res.status(400).send();
  });
});

// PATCH /api/notes/:id API
router.patch('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ['text', 'completed']);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Note.findOneAndUpdate({_id: id, _creator: req.user._id}, {$set: body}, {new: true}).then((note) => {
    if (!note) {
      return res.status(404).send();
    }

    res.send({note});
  }).catch((e) => {
    res.status(400).send();
  })
});

module.exports = router;
