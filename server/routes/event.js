//event.js
const _ = require('lodash');
var express  = require('express');
var router = express.Router();
var {Event} = require('./../models/event');
var {Group} = require('./../models/group');

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
    res.status(400).send();
  });
});

// GET /api/events/group/:id API
router.get('/group/:id',passport.authenticate('jwt', { session: false }), (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  // check is not a group member
  Group.find({
      _id: req.body.groupId,
      member:{$elemMatch:{_id:req.user._id}}
    }).exec((err, group) => {
      if (err) return handleError(err);

      Event.find({
        groupId: id
      }).then((events) => {
        res.send({events});
      }, (e) => {
        res.status(400).send();
      });
    });
});

// POST /api/events API
// router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
//   var event = new Event({
//     text: req.body.text,
//     _creator: req.user._id,
//     startDate: req.body.startDate,
//     endDate:	req.body.endDate,
//   });
//
//   event.save().then((doc) => {
//     res.send(doc);
//   }, (e) => {
//     res.status(400).send(e);
//   });
// });

// POST /api/events API
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  // check is not a member
  if (req.body.isGroup) {

    Group.find(
      {_id: req.body.groupId})
      .exec((err, group) => {
        if (err) return handleError(err);
        var picked = _.filter(group[0]['member'], { '_id':req.user._id} );
        // check is not in group
        if (picked == '') {
          return res.status(404).send('You are not in this group!');
        }
        // check is not approval
        if (picked[0]['confirmed'] != true) {
          return res.status(404).send('Waiting for group admin approval!');
        }

        var event = new Event({
                  text: req.body.text,
                  _creator: req.user._id,
                  startDate: req.body.startDate,
                  endDate:	req.body.endDate,
                  isGroup: req.body.isGroup,
                  groupId:req.body.groupId
        });

        event.save().then((doc) => {
          res.send(doc);
        }, (e) => {
          res.status(400).send();
        });
      })

    } else {
        // save event as personal
        var event = new Event({
          text: req.body.text,
          _creator: req.user._id,
          startDate: req.body.startDate,
          endDate:	req.body.endDate,
        });

        event.save().then((doc) => {
          res.send(doc);
        }, (e) => {
          res.status(400).send();
        });
    }
});

// // POST /api/events API
// router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
//
//   // check is not a group member
//   if (req.body.isGroup) {
//     Group.find({
//         _id: req.body.groupId,
//         member:{$elemMatch:{_id:req.user._id}}
//       }).exec((err, group) => {
//         if (err) return handleError(err);
//
//         // save event as group event
//         var event = new Event({
//           text: req.body.text,
//           _creator: req.user._id,
//           startDate: req.body.startDate,
//           endDate:	req.body.endDate,
//           isGroup: req.body.isGroup,
//           groupId:req.body.groupId
//         });
//
//         event.save().then((doc) => {
//           res.send(doc);
//         }, (e) => {
//           res.status(400).send();
//         });
//       })
//   } else {
//     // save event as personal
//     var event = new Event({
//       text: req.body.text,
//       _creator: req.user._id,
//       startDate: req.body.startDate,
//       endDate:	req.body.endDate,
//     });
//
//     event.save().then((doc) => {
//       res.send(doc);
//     }, (e) => {
//       res.status(400).send();
//     });
//   }
// });

// GET /api/event/:id API
// router.get('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
//   var id = req.params.id;
//
//   if (!ObjectID.isValid(id)) {
//     return res.status(404).send();
//   }
//
//   Event.findOne({
//     _id: id,
//     _creator: req.user._id
//   }).then((event) => {
//     if (!event) {
//       return res.status(404).send();
//     }
//
//     res.send({event});
//   }).catch((e) => {
//     res.status(400).send();
//   });
// });

// DELETE /api/events/:id API
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

// PATCH /api/events/:id API
router.patch('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ['text', 'startDate', 'endDate']);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Event.findOneAndUpdate(
          {_id: id, _creator: req.user._id},
          {$set: body},
          {new: true}).then((event) => {
    if (!event) {
      return res.status(404).send();
    }

    res.send({event});
  }).catch((e) => {
    res.status(400).send();
  })
});

// POST /api/events/search API
router.post('/search', passport.authenticate('jwt', { session: false }), (req, res) => {
  Event.find({
    "_creator": req.user._id,
    $text: {$search: req.body.text}
    }).then((events) => {
    res.send({events});
  }, (e) => {
    res.status(400).send();
  });
});

// POST /api/events/birthday API
router.post('/birthday', passport.authenticate('jwt', { session: false }), (req, res) => {

  if (req.body.isGroup) {

    Group.find({
        _id: req.body.groupId,
        member:{$elemMatch:{_id:req.user._id}}
      }).exec((err) => {
        if (err) return handleError(err);

        //save event
        var event = new Event({
          text: "Birthday",
          _creator: req.user._id,
          startDate: req.user.birthday,
          endDate:	req.user.birthday,
          isGroup: req.body.isGroup,
          groupId:req.body.groupId
        });

        event.save().then((doc) => {
          res.send(doc);
        }, (e) => {
          res.status(400).send();
        });
      })
  } else {
    var event = new Event({
      text: "Birthday",
      _creator: req.user._id,
      startDate: req.user.birthday,
      endDate:	req.user.birthday,
    });

    event.save().then((doc) => {
      res.send(doc);
    }, (e) => {
      res.status(400).send();
    });
  }
});

module.exports = router;
