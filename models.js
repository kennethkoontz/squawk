var mongoose = require('mongoose').connect('localhost', 'squawk', '27017'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var UserModel = new Schema({
    id: ObjectId,
    email: String,
    firstName: String,
    lastName: String,
    password: String,
});

var MessageModel = new Schema({
    id: ObjectId,
    createdDate: { type: Date, default: Date.now },
    user: String,
    body: String,
    stars: [String],
    starred: Boolean
});

var User = mongoose.model('user', UserModel);
var Message = mongoose.model('message', MessageModel);

exports.User = User;
exports.Message = Message;
