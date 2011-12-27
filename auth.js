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

var User = mongoose.model('user', UserModel);

module.exports.authenticate = function(email, password, callback) {
    User.find({email: email}, function (err, record) {
        if (err) {
            callback(err, null);
            return;
        }
        // No records returned, incorrect email.
        if (record.length === 0) {
            callback(null, null);
            return;
        }
        // Is password correct?
        if (record[0].password === password) {
            callback(null, record[0].email);
            return;
        }
        callback(null, null);
    });
}
