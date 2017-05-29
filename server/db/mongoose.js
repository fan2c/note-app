var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, (err, res) => {
  if (res) {
    console.log('mongoDB connection is faild');
    console.log(err);
  } else {
    console.log('mongoDB connection is successful');
  }
});

module.exports = {mongoose};
