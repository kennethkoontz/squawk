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

var MessageModel = new Schema({
    id: ObjectId
  , createdDate: { type: Date, default: Date.now }
  , user: String
  , body: String
});

var User = mongoose.model('user', UserModel);
var Message = mongoose.model('message', MessageModel);

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
    subscriber.psubscribe('channel:room:1');

    subscriber.on('pmessage', function (pattern, channel, message) {
        if (message === 'update-userlist') {
            client.SMEMBERS('room:1', function (err, members) {
                var response = [];
                members.forEach(function (item) {
                    response.push({name: item});
                });
                socket.emit('update-userlist', response);
            }); 
        } else {
            socket.send(message);
        } 
    });

    socket.on('message', function (data) {
        // Save to Mongo Database.
        var json = JSON.parse(data);
        User.find({email: json.email}, {firstName: 1, lastName: 1}, function (err, doc) {
            var m = {
                user: doc[0].firstName + ' ' + doc[0].lastName[0] + '.',
                body: json.message
            }
            message = new Message(m);
            message.save(function (err, doc) {
                // If there is an error with saving to Mongo. Log this. Else
                // publish message.
                if (err) {
                    console.log(err);
                }
                var savedMessage = {};
                savedMessage.user = doc.user;
                savedMessage.body = doc.body;
                savedMessage.createdDate = new Date(doc.createdDate).toISOString();
                publisher.publish('channel:room:1', JSON.stringify(savedMessage));
            });
        });
    });

    socket.on('set name', function (name) {
        User.find({email: name}, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                var name = doc[0].firstName + ' ' + doc[0].lastName[0] + '.';
                client.SADD('room:1', name, redis.print);
                socket.set('user', name)
                publisher.publish('channel:room:1', 'update-userlist');
            }
        });
    });

    socket.on('disconnect', function (err, data) {
        socket.get('user', function(err, user) {
            client.SREM('room:1', user);
            publisher.publish('channel:room:1', 'update-userlist');
        });
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
                if (err) {
                    console.log(err);
                }
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

app.get('/messages', function(req, res) {
    Message.find({}, {user:1, body:1, createdDate: 1, _id: 0}, function(err, doc) {
        res.send(doc);
    });
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
            req.session.user = email;
            res.redirect(req.body.redir || '/room');
        } else {
            req.flash('warn', 'oops! did you type in your email and/or password correctly?');
            res.render('sessions/new', {locals: {redir: req.body.redir}});
        } 
    });
});

app.listen(8000);
