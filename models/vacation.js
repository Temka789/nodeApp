var mongoose = require('mongoose');
var userShema = mongoose.Schema({
  name: String,
  lastName: String,
  email: String,
  pass: String
});

var User = mongoose.model('User', userShema);

module.exports = User;