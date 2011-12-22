var app = require('express').createServer();

app.get('/', function(req, res) {
    res.send('render page');
});

app.listen(8000);
