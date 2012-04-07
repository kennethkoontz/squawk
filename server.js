var app = require('express').createServer(),
    us = require('underscore'),
    express = require('express'),
    redis = require("redis"),
    io = require('socket.io').listen(app),
    client = redis.createClient(),
    publisher = redis.createClient(),
    subscriber = redis.createClient(),
    RedisStore = require('connect-redis')(express),
    User = require('./models').User,
    Message = require('./models').Message,
    routes = require('./routes')(app);

app.set("view engine", "jade");
app.set("view options", { layout: false });
app.register(".jade", require("jade").express);
app.use("/javascripts", express.static(__dirname + '/javascripts'));
app.use("/styles", express.static(__dirname + '/styles'));
app.use("/models", express.static(__dirname + '/models'));
app.use("/", express.static(__dirname + "/images"));
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
                savedMessage._id = doc._id;
                savedMessage.createdDate = new Date(doc.createdDate).toISOString();
                publisher.publish('channel:room:1', JSON.stringify(savedMessage));
            });
        });
    });

    socket.on('set name', function (name) {
        User.find({email: name}, function (err, doc) {
            if (err) {
                console.log(err);
            }
            try {
                var name = doc[0].firstName + ' ' + doc[0].lastName[0] + '.';
                client.SADD('room:1', name, redis.print);
                socket.set('user', name)
                publisher.publish('channel:room:1', 'update-userlist');
            } catch (e) {
		if (e instanceof TypeError) {
                    return;
		} else {
                    console.log(e);
                }
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

// -- Routes -- 
var routes = require('./routes')(app);

app.listen(8000);
