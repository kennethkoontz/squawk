var auth = require('./auth'),
    moment = require('moment');

function requiresLogin(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/sessions/new?redir=' + req.url);
    }
};

var routes = function(app) {
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
        var today = new moment();
        res.render('room', {date: today.format("dddd, MMMM D YYYY")});
    });
    
    app.get('/room/archive/:month/:day/:year', requiresLogin, function(req, res) {
        var day = new moment(new Date(req.params.year, parseInt(req.params.month) - 1, req.params.day));
        var nextDay = new moment(new Date(req.params.year, parseInt(req.params.month) - 1, parseInt(req.params.day)+1));
    
        Message.find({createdDate: {$gte: day, $lt: nextDay}}, {user:1, body:1, createdDate: 1, _id: 0}, function(err, doc) {
            res.render('archive', {date: day.format("dddd, MMMM D YYYY"), messages: doc});
        });
    });
    
    app.get('/messages', function(req, res) {
        // Construct start and end date objects to be used with query.
        var today = new Date();
        var start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        var end = new Date(today.getFullYear(), today.getMonth(), today.getDate()+1);
    
        Message.find({createdDate: {$gte: start, $lt: end}}, {user:1, body:1, stars:1, starred: 1, createdDate: 1}, function(err, doc) {
            doc.forEach(function(e, i) {
                if (us.indexOf(e.stars, req.session.user) !== -1) {
                    doc[i].starred = true;
                } else {
                    doc[i].starred = false;
                }
            });
            res.send(doc);
        });
    });
    
    app.get('/star/message/:id', function(req, res) {
        Message.findOne({_id: req.params.id}, {stars:1}, function(err, doc) {
            console.log(doc.stars);
            if (us.indexOf(doc.stars, req.session.user) !== -1) {
                // remove record
                doc.stars.remove(req.session.user);
                doc.save(function (err) {
                    if (err) {
                        console.log('There was a problem with saving: ' + doc);
                    }
                });
            } else {
                // add record
                doc.stars.push(req.session.user);
                doc.save(function (err) {
                    if (err) {
                        console.log('There was a problem with saving: ' + doc);
                    }
                });
            }
        });
        res.send('starring');
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
}

module.exports = routes;
