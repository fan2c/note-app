const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Note} = require('./../../models/note');
const {User} = require('./../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();
const users = [{
  _id: userOneId,
  email: 'test1@example.com',
  password: 'userOnePass',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userOneId, access: 'auth'}, process.env.JWT_SECRET).toString()
  }]
}, {
  _id: userTwoId,
  email: 'test2@example.com',
  password: 'userTwoPass',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userTwoId, access: 'auth'}, process.env.JWT_SECRET).toString()
  }]
}];

const notes = [{
  _id: new ObjectID(),
  text: 'First test note',
  _creator: userOneId
}, {
  _id: new ObjectID(),
  text: 'Second test note',
  completed: true,
  completedAt: 333,
  _creator: userTwoId
}];

const populateNotes = (done) => {
  Note.remove({}).then(() => {
    return Note.insertMany(notes);
  }).then(() => done());
};

const populateUsers = (done) => {
  User.remove({}).then(() => {
    var userOne = new User(users[0]).save();
    var userTwo = new User(users[1]).save();

    return Promise.all([userOne, userTwo])
  }).then(() => done());
};

module.exports = {notes, populateNotes, users, populateUsers};
