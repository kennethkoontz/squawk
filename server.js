var app = require('express').createServer()
  , redis = require("redis")
  , client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});

app.get('/', function(req, res) {
    res.send('render page');
});

app.listen(8000);
