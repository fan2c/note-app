const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Note} = require('./../models/note');
const {User} = require('./../models/user');
const {notes, populateNotes, users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateNotes);

describe('POST /notes', () => {
  it('should create a new note', (done) => {
    var text = 'Test note text';

    request(app)
      .post('/api/notes')
      // .set('x-auth', users[0].tokens[0].token)
      .set('authorization', 'JWT '+ users[0].tokens[0].token)
      .send({text})
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Note.find({text}).then((notes) => {
          expect(notes.length).toBe(1);
          expect(notes[0].text).toBe(text);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should not create note with invalid body data', (done) => {
    request(app)
      .post('/api/notes')
      // .set('x-auth', users[0].tokens[0].token)
      .set('authorization', 'JWT '+ users[0].tokens[0].token)
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Note.find().then((notes) => {
          expect(notes.length).toBe(2);
          done();
        }).catch((e) => done(e));
      });
  });
});

describe('GET /notes', () => {
  it('should get all notes', (done) => {
    request(app)
      .get('/api/notes')
      // .set('x-auth', users[0].tokens[0].token)
      .set('authorization', 'JWT '+ users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.notes.length).toBe(1);
      })
      .end(done);
  });
});

describe('GET /notes/:id', () => {
  it('should return note doc', (done) => {
    request(app)
      .get(`/api/notes/${notes[0]._id.toHexString()}`)
      // .set('x-auth', users[0].tokens[0].token)
      .set('authorization', 'JWT '+ users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.note.text).toBe(notes[0].text);
      })
      .end(done);
  });

  it('should not return note doc created by other user', (done) => {
    request(app)
      .get(`/api/notes/${notes[1]._id.toHexString()}`)
      // .set('x-auth', users[0].tokens[0].token)
      .set('authorization', 'JWT '+ users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 if note not found', (done) => {
    var hexId = new ObjectID().toHexString();

    request(app)
      .get(`/api/notes/${hexId}`)
      // .set('x-auth', users[0].tokens[0].token)
      .set('authorization', 'JWT '+ users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 for non-object ids', (done) => {
    request(app)
      .get('/api/notes/123abc')
      // .set('x-auth', users[0].tokens[0].token)
      .set('authorization', 'JWT '+ users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe('DELETE /notes/:id', () => {
  it('should remove a note', (done) => {
    var hexId = notes[1]._id.toHexString();

    request(app)
      .delete(`/api/notes/${hexId}`)
      // .set('x-auth', users[1].tokens[0].token)
      .set('authorization', 'JWT '+ users[1].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.note._id).toBe(hexId);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Note.findById(hexId).then((note) => {
          expect(note).toNotExist();
          done();
        }).catch((e) => done(e));
      });
  });

  it('should remove a note', (done) => {
    var hexId = notes[0]._id.toHexString();

    request(app)
      .delete(`/api/notes/${hexId}`)
      // .set('x-auth', users[1].tokens[0].token)
      .set('authorization', 'JWT '+ users[1].tokens[0].token)

      .expect(404)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Note.findById(hexId).then((note) => {
          expect(note).toExist();
          done();
        }).catch((e) => done(e));
      });
  });

  it('should return 404 if note not found', (done) => {
    var hexId = new ObjectID().toHexString();

    request(app)
      .delete(`/api/notes/${hexId}`)
      // .set('x-auth', users[1].tokens[0].token)
      .set('authorization', 'JWT '+ users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 if object id is invalid', (done) => {
    request(app)
      .delete('/api/notes/123abc')
      // .set('x-auth', users[1].tokens[0].token)
      .set('authorization', 'JWT '+ users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe('PATCH /notes/:id', () => {
  it('should update the note', (done) => {
    var hexId = notes[0]._id.toHexString();
    var text = 'This should be the new text';

    request(app)
      .patch(`/api/notes/${hexId}`)
      // .set('x-auth', users[0].tokens[0].token)
      .set('authorization', 'JWT '+ users[0].tokens[0].token)
      .send({
        completed: true,
        text
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.note.text).toBe(text);
        expect(res.body.note.completed).toBe(true);
        expect(res.body.note.completedAt).toBeA('number');
      })
      .end(done);
  });

  it('should not update the note created by other user', (done) => {
    var hexId = notes[0]._id.toHexString();
    var text = 'This should be the new text';

    request(app)
      .patch(`/api/notes/${hexId}`)
      // .set('x-auth', users[1].tokens[0].token)
      .set('authorization', 'JWT '+ users[1].tokens[0].token)
      .send({
        completed: true,
        text
      })
      .expect(404)
      .end(done);
  });

  it('should clear completedAt when note is not completed', (done) => {
    var hexId = notes[1]._id.toHexString();
    var text = 'This should be the new text!!';

    request(app)
      .patch(`/api/notes/${hexId}`)
      // .set('x-auth', users[1].tokens[0].token)
      .set('authorization', 'JWT '+ users[1].tokens[0].token)
      .send({
        completed: false,
        text
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.note.text).toBe(text);
        expect(res.body.note.completed).toBe(false);
        expect(res.body.note.completedAt).toNotExist();
      })
      .end(done);
  });
});

describe('GET /users/me', () => {
  it('should return user if authenticated', (done) => {
    request(app)
      .get('/api/users/me')
      // .set('x-auth', users[0].tokens[0].token)
      .set('authorization', 'JWT '+ users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.email).toBe(users[0].email);
      })
      .end(done);
  });

  it('should return 401 if not authenticated', (done) => {
    request(app)
      .get('/api/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe('POST /users', () => {
  it('should create a user', (done) => {
    var email = 'example@example.com';
    var password = '123mnb!';

    request(app)
      .post('/api/users')
      .send({email, password})
      .expect(200)
      .expect((res) => {
        expect(res.headers['authorization']).toExist();
        expect(res.body._id).toExist();
        expect(res.body.email).toBe(email);
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.findOne({email}).then((user) => {
          expect(user).toExist();
          expect(user.password).toNotBe(password);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should return validation errors if request invalid', (done) => {
    request(app)
      .post('/api/users')
      .send({
        email: 'and',
        password: '123'
      })
      .expect(400)
      .end(done);
  });

  it('should not create user if email in use', (done) => {
    request(app)
      .post('/api/users')
      .send({
        email: users[0].email,
        password: 'Password123!'
      })
      .expect(400)
      .end(done);
  });
});

describe('POST /users/login', () => {
  it('should login user and return auth token', (done) => {
    request(app)
      .post('/api/users/login')
      .send({
        email: users[1].email,
        password: users[1].password
      })
      .expect(200)
      .expect((res) => {
        // expect(res.headers['x-auth']).toExist();
        expect(res.headers['authorization']).toExist();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens[1]).toInclude({
            access: 'auth',
            // token: res.headers['x-auth']
            token: res.headers['authorization']

          });
          done();
        }).catch((e) => done(e));
      });
  });

  it('should reject invalid login', (done) => {
    request(app)
      .post('/api/users/login')
      .send({
        email: users[1].email,
        password: users[1].password + '1'
      })
      .expect(400)
      .expect((res) => {
        // expect(res.headers['x-auth']).toNotExist();
        expect(res.headers['authorization']).toNotExist();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens.length).toBe(1);
          done();
        }).catch((e) => done(e));
      });
  });
});

describe('DELETE /users/me/token', () => {
  it('should remove auth token on logout', (done) => {
    request(app)
      .delete('/api/users/me/token')
      // .set('x-auth', users[0].tokens[0].token)
      .set('authorization', 'JWT '+ users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[0]._id).then((user) => {
          expect(user.tokens.length).toBe(0);
          done();
        }).catch((e) => done(e));
      });
  });
});
