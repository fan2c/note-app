//passport.js

var {User} = require('./../models/user');

var LocalStrategy = require('passport-local').Strategy;
var passportJWT = require('passport-jwt')
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
opts.secretOrKey = process.env.JWT_SECRET;

module.exports = function(passport) {

  /**
     * JWT AUTH
     * based on passport-jwt
     */
  passport.use(new JwtStrategy(opts, (jwt_payload, done) => {

    // console.log('payload received', jwt_payload.id);

    // asynchronous
    process.nextTick(() => {
      User.findById({_id: jwt_payload._id }, (err, user) => {
        if (err) {
          return done(err, false);
        }
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      });
    });
  }));

  // used to serialize the user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });

  /**
   * LOCAL LOGIN
   * based on passport-local
   */
  passport.use('local-login', new LocalStrategy({
      // override with email. by default, local strategy uses username and password
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true // pass req from route to check if a user is logged
    },
    function(req, email, password, done) {
      if (email)
        email = email.toLowerCase(); // lowercase email

      // asynchronous
      process.nextTick(() => {
        User.findOne({
          'email': email
        }, (err, user) => {
          if (err) {
            return done(err);
          }
          // if no user is found, return the message
          if (!user) {
            return done(null, false, req.flash('loginMessage', 'No user found.'));
          }
          if (!user.validPassword(password)) {
            return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
          } else {
            return done(null, user);
          }

        });
      });
    }));

  /**
   * LOCAL SIGNUP
   * based on passport-local
   */
  passport.use('local-signup', new LocalStrategy({
      // override with email. by default, local strategy uses username and password
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    function(req, email, password, done) {
      if (email)
        email = email.toLowerCase(); // lowercase email

      // asynchronous
      process.nextTick(() => {
        // if the user is not already logged in:
        if (!req.user) {
          User.findOne({'email': email }, (err, user) => {
            if (err) {
              return done(err);
            }
            // check to see if theres already a user with that email
            if (user) {
              return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            } else {

              // create the user
              var newUser = new User();

              newUser.email = email;
              newUser.password = password;

              newUser.save((err) => {
                if (err) {
                  return done(err);
                }
                return done(null, newUser);
              });
            }
          });
          // if the user is logged in but has no local account...
        } else if (!req.user.email) {

          // check email weather used by another user
          User.findOne({ 'email': email }, (err, user) => {
            if (err) {
              return done(err);
            }
            if (user) {
              return done(null, false, req.flash('loginMessage', 'That email is already taken.'));
            } else {
              var user = req.user;
              user.email = email;
              user.password = password;
              user.save((err) => {
                if (err) {
                  return done(err);
                }
                return done(null, user);
              });
            }
          });
        } else {
          // Ignore signup while user already logged
          return done(null, req.user);
        }

      });

    }));
};
