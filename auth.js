var mongoose = require('mongoose').connect('localhost', 'squawk', '27017')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var UserModel = new Schema({
    id: ObjectId
  , email: String
  , firstName: String
  , lastName: String
  , password: String
});

var User = mongoose.model('UserModel', UserModel);

module.exports.authenticate = function(email, password, callback) {
    User.find({email: email}, function (err, record) {
        if (err) {
            callback(err, null);
            return;
        }
        var userEmail = record[0].email;
        if (!userEmail) {
            callback(null, null);
            return;
        }
        if (record[0].password === password) {
            callback(null, userEmail);
            return;
        }
        callback(null, null);
    });
}
