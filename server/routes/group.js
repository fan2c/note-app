
//group.js
const _ = require('lodash');
var express  = require('express');
var router = express.Router();
var {Group} = require('./../models/group');
var moment = require('moment');
const {ObjectID} = require('mongodb');
var passport = require('passport');

// GET /api/groups API
router.get('/',passport.authenticate('jwt', { session: false }), (req, res) => {
  Group.find({
    // _creator: req.user._id
  }).then((groups) => {
    res.send({groups});
  }, (e) => {
    res.status(400).send(e);
  });
});

// POST /api/groups API
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  var group = new Group({
    groupName: req.body.groupName,
    _creator: req.user._id
    // member: req.body.member,
  });

  group.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});

// // GET /api/groups/:id API
// router.get('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
//   var id = req.params.id;
//
//   if (!ObjectID.isValid(id)) {
//     return res.status(404).send();
//   }
//
//   Group.findOne({
//     _id: id,
//     _creator: req.user._id
//   }).then((group) => {
//     if (!group) {
//       return res.status(404).send();
//     }
//
//     res.send({group});
//   }).catch((e) => {
//     res.status(400).send();
//   });
// });

// DELETE /api/groups/:id API
router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Group.findOneAndRemove({
    _id: id,
    _creator: req.user._id
  }).then((group) => {
    if (!group) {
      return res.status(404).send();
    }

    res.send({group});
  }).catch((e) => {
    res.status(400).send();
  });
});

// PATCH /api/groups/:id API
router.patch('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ['groupName']);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Group.findOneAndUpdate({_id: id, _creator: req.user._id}, {$set: body}, {new: true}).then((group) => {
    if (!group) {
      return res.status(404).send();
    }

    res.send({group});
  }).catch((e) => {
    res.status(400).send();
  })
});

// PATCH /api/groups/:id API
router.post('/member/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ['name']);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  // console.log(body);
  Group.findOneAndUpdate({_id: id, _creator: req.user._id}, {$push: {member:body}}, {new: true}).then((group) => {
    if (!group) {
      return res.status(404).send();
    }

    res.send({group});
  }).catch((e) => {
    res.status(400).send(e);
  })
});

module.exports = router;
