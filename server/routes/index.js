// index.js

var {Note} = require('./../models/note');

module.exports = function (app, passport) {

  /**
   * RESTFUL API
   * extend
   */
  app.use('/api/users', require('./user'));
  app.use('/api/notes', require('./note'));

  // catch 404 error handler
  app.use(function (req, res, next) {
      var err = new Error('Not Found');
      err.status = 404;
      res.send('404');
  });

  /**
   * NORMAL ROUTES
   * local view
   */

   // show the index page
   app.get('/',(req, res) => {
     res.render('index', {user: req.user});
   });

  // GET register page
  app.get('/register', (req, res) => {
    res.render('register');
  });

  // POST register page
  app.post('/register', passport.authenticate('local-signup', {
            successRedirect : '/',
            failureRedirect : '/login',
            failureFlash : true // allow flash messages
  }));

  // GET login form
  app.get('/login', (req, res) => {
             res.render('login', { message: req.flash('loginMessage') });
  });

  // POST user login
  app.post('/login', passport.authenticate('local-login', {
              successRedirect : '/',
              failureRedirect : '/login',
              failureFlash : true
  }));

  // LOGOUT
  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });


  // GET note page
  app.get('/note', isLoggedIn, (req, res) => {

    Note.find({
      _creator: req.user.id
    }).then((notes) => {
      res.render('note',{notes: notes});
    }, (e) => {
      res.status(400).send(e);
    });
  });
};

// the function ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
      return next();

  res.redirect('/');
};
