//server.js

require('./config/config');

var _ = require('lodash');
var express = require('express');
var bodyParser = require('body-parser');
var hbs = require('hbs');
var path = require('path');

var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');

var {mongoose} = require('./db/mongoose');

var app = express();
const port = process.env.PORT;

var passport = require('passport');
require('./middleware/passport')(passport);
var flash =require('connect-flash');

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Setting for session
app.use(session({
  secret: 'keyboard123',
  resave: true,
  saveUninitialized: true,
}));

// Setting passport, flash
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Set handlebarsjs view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));

require('./routes/index.js')(app, passport);

app.listen(port, () => {
  console.log(`Started up at port ${port}`);
});

module.exports = {app};
