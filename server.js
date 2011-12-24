var app = require('express').createServer()
  , auth = require('./auth')
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

app.dynamicHelpers(
    {
        session: function(req, res) {
            return req.session;
        },

        request: function(req, res) {
            return req;
        },

        flash: function(req, res) {
            return req.flash();
        },
    }
);

client.on("error", function (err) {
    console.log("Error " + err);
});

function requiresLogin(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/sessions/new?redir=' + req.url);
    }
};

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

app.post('/register', function(req, res) {
    User.find({ email: req.body.email}, function (err, record) {
        if (err) {
            console.log(err);
        }
        if (record.length === 0) {
            var user = new User(req.body);
            user.save(function (err) {
                // If there is an error here we should raise a 500 error.
                console.log(err);
            });
            req.session.user = req.body.email;
            res.redirect('/room');
        } else {
            res.render('register');
        }
    });
});

app.get('/room', requiresLogin, function(req, res) {
    res.render('room');
});

/* Sessions */
app.get('/sessions/new', function(req, res) {
    res.render('sessions/new', {locals: {redir: req.query.redir || req.body.redir}});
});

app.get('/session/destroy', function(req, res) {
    req.session.destroy(function(err) {
        console.log(err);
        res.redirect('/');
    });
});

app.post('/sessions', function(req, res) {
    auth.authenticate(req.body.email, req.body.password, function (err, email) {
        if (email) {
            console.log(req.body.redir);
            req.session.user = email;
            res.redirect(req.body.redir || '/room');
        } else {
            req.flash('warn', 'oops! did you type in your email and/or password correctly?');
            res.render('sessions/new', {locals: {redir: req.body.redir}});
        } 
    });
});

app.listen(8000);
