var redis = require("redis"),
    client = redis.createClient(),
    publisher = redis.createClient(),
    subscriber = redis.createClient(),
    User = require('./models').User,
    Message = require('./models').Message;

var sockets = function (app) {
    var io = require('socket.io').listen(app);

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
}

module.exports = sockets;
