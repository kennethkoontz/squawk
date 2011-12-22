var app = require('express').createServer()
  , express = require('express')
  , jqtpl = require('jqtpl')
  , redis = require("redis")
  , io = require('socket.io').listen(app)
  , client = redis.createClient()
  , publisher = redis.createClient()
  , subscriber = redis.createClient();

app.set("view engine", "html");
app.register(".html", require("jqtpl").express);
app.use("/javascripts", express.static(__dirname + '/javascripts'));
app.use("/styles", express.static(__dirname + '/styles'));
app.use("/models", express.static(__dirname + '/models'));

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
    app.set("view options", {
        layout: false
    });
    res.render('room');
});

app.listen(8000);
