var app = require('express').createServer()
  , express = require('express')
  , jqtpl = require('jqtpl')
  , redis = require("redis")
  , client = redis.createClient();

app.set("view engine", "html");
app.register(".html", require("jqtpl").express);
app.use("/javascripts", express.static(__dirname + '/javascripts'));
app.use("/styles", express.static(__dirname + '/styles'));

client.on("error", function (err) {
    console.log("Error " + err);
    asdfasf
});

app.get('/', function(req, res) {
    app.set("view options", {
        layout: false
    });
    res.render('room');
});

app.listen(8000);
