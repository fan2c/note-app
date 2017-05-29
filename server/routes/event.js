//event.js
const _ = require('lodash');
var express  = require('express');
var router = express.Router();
var {Event} = require('./../models/event');
var moment = require('moment');
const {ObjectID} = require('mongodb');
var passport = require('passport');

// GET /api/events API
router.get('/',passport.authenticate('jwt', { session: false }), (req, res) => {
  Event.find({
    _creator: req.user._id
  }).then((events) => {
    res.send({events});
  }, (e) => {
    res.status(400).send(e);
  });
});

// POST /api/events API
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  var event = new Event({
    text: req.body.text,
    _creator: req.user._id,
    startDate: req.body.startDate,
    endDate:	req.body.endDate
  });

  event.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});


// GET /api/event/:id API
router.get('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Event.findOne({
    _id: id,
    _creator: req.user._id
  }).then((event) => {
    if (!event) {
      return res.status(404).send();
    }

    res.send({event});
  }).catch((e) => {
    res.status(400).send();
  });
});

// DELETE /api/event/:id API
router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Event.findOneAndRemove({
    _id: id,
    _creator: req.user._id
  }).then((event) => {
    if (!event) {
      return res.status(404).send();
    }

    res.send({event});
  }).catch((e) => {
    res.status(400).send();
  });
});

// PATCH /api/event/:id API
router.patch('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ['text', 'startDate', 'endDate']);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  // if (_.isBoolean(body.completed) && body.completed) {
  //   body.completedAt = new Date().getTime();
  // } else {
  //   body.completed = false;
  //   body.completedAt = null;
  // }

  Event.findOneAndUpdate({_id: id, _creator: req.user._id}, {$set: body}, {new: true}).then((event) => {
    if (!event) {
      return res.status(404).send();
    }

    res.send({event});
  }).catch((e) => {
    res.status(400).send();
  })
});

module.exports = router;
