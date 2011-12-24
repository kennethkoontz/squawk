var app = require('express').createServer()
  , express = require('express')
  , jade = require('jade')
  , redis = require("redis")
  , mongoose = require('mongoose').connect('localhost', 'squawk', '27017')
  , io = require('socket.io').listen(app)
  , client = redis.createClient()
  , publisher = redis.createClient()
  , subscriber = redis.createClient()
  , RedisStore = require('connect-redis')(express);

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var UserModel = new Schema({
    id: ObjectId
  , email: String
  , firstName: String
  , lastName: String
  , password: String
});

var User = mongoose.model('UserModel', UserModel);

app.set("view engine", "jade");
app.set("view options", { layout: false });
app.register(".jade", require("jade").express);
app.use("/javascripts", express.static(__dirname + '/javascripts'));
app.use("/styles", express.static(__dirname + '/styles'));
app.use("/models", express.static(__dirname + '/models'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'secretpassword', store: new RedisStore}));

client.on("error", function (err) {
    console.log("Error " + err);
});

io.sockets.on('connection', function (socket) {
    subscriber.subscribe('channel');

    subscriber.on("message", function (channel, message) {
        socket.send(message);
    });

    socket.on('message', function (data) {
        publisher.publish('channel', data);
    });
});

app.get('/', function(req, res) {
    res.render('register');
});

app.post('/room', function(req, res) {
    console.log(req.body.email);
    User.find({ email: req.body.email}, function (err, doc) {
        if (err) {
            console.log(err);
        }
        if (doc.length === 0) {
            var user = new User(req.body);
            user.save(function (err) {
                // If there is an error here we should raise a 500 error.
                console.log(err);
            });
            res.render('room');
	    console.log('created', user);
        } else {
            res.render('room');
	    console.log('user', user, 'already created');
        }
    });
});

app.listen(80);
