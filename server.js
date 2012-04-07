var app = require('express').createServer(),
    express = require('express'),
    RedisStore = require('connect-redis')(express);

app.set("view engine", "jade");
app.set("view options", { layout: false });
app.register(".jade", require("jade").express);
app.use("/javascripts", express.static(__dirname + '/static/javascripts'));
app.use("/styles", express.static(__dirname + '/static/stylesheets'));
app.use("/models", express.static(__dirname + '/models'));
app.use("/", express.static(__dirname + "/static/images"));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'secretpassword', store: new RedisStore}));

// -- Sockets -- 
var sockets = require('./sockets')(app);

// -- Routes -- 
var routes = require('./routes')(app);

app.listen(8000);
