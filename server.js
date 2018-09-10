var express = require('express');
var app = express();
var path = require('path');
var utils = require('./routes/utils.js')
var client = utils.client;
var bodyParser = require('body-parser');
var session = require('express-session');
var redisStore = require('connect-redis')(session);
var http = require('http').Server(app);
var port = process.env.PORT || 3000;

var isLoggedIn = function(req, res, next) {
    if(req.session && req.session.userName) {
        next();
    } else {
        res.sendFile(path.resolve(__dirname, './views/login.html'));
    }
}

var isAdmin = function(req, res, next) {
    if(req.session && req.session.userName == 'admin') {
        next();
    } else {
        req.session.destroy();
        res.send({"status" : 0, "message" : "Unauthorized Access"});
    }
}

app.use(express.static('public'));
app.use(session({
    'secret' : 'keyboard cat',
    'store': new redisStore({
        host: 'localhost',
        port: 6379,
        disableTTL: true
    }),
    'cookie' : {
        path: '/',
        httpOnly: true,
        secure: false,
        maxAge: 24*60*60*1000
    },
    'saveUninitialized' : false,
    'resave' : false
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('views', path.resolve('./views'));

app.get('/', isLoggedIn, function(req, res) {
    if(req.session.userName != 'admin') {
        res.sendFile(path.resolve(__dirname, './views/index.html'));
    } else {  
        res.sendFile(path.resolve(__dirname, './views/admin.html'));
    }
})

app.get('/getUserList', function(req, res) {
    client.get("users", function(error, data) {
        if(!error && data) {
            data = JSON.parse(data);
            res.send({"status" : 1, "users" : data.users});
        } else {
            console.log(error);
            res.send({"status" : 0, "message" : "We are facing some issue, please comeback in some time"});
        }
    })
})

app.post('/login', function(req, res) {
    client.get("user:" + req.body.userName, function(error, data) {
        if(!error && data) {
            req.session.userName = req.body.userName;
            res.send({"status":1});
        } else {
            console.log(error);
            res.send({"status":0, "message":"Unable to login, please try again in some time."});
        }
    })
})

app.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/');
})

app.use('/user', isLoggedIn, require('./routes/general.js'));
app.use('/admin', isAdmin, require('./routes/admin.js'));

app.get('/newUser', function(req, res) {
    var userName = req.query.userName;

    if(userName && userName.length >= 8) {
        client.get("user:" + userName, function(error, data) {
            if(error) {
                res.send({"status" : 0, "message" : "Unable to create new user, please try again."});
            } else {
                if(data) {
                    res.send({"status" : 0, "message" : "Username taken!"});
                } else {

                  // Add new user to "users"
                  client.get("users", function(error, data) {
                      if(!error) {
                          data = JSON.parse(data);
                          data.users.push(userName);
                          client.set("users", JSON.stringify(data), function(error) {
                            if(error) {
                                res.send({"status" : 0, "message" : "Unable to create new user, please try again."});
                            }
                          })
                      } else {
                          res.send({"status" : 0, "message" : "Unable to create new user, please try again."});
                      }
                  })

                  var userObj = {
                    'userName' : userName,
                    'INR' : 0
                  }

                  //create the new "userName" object in the db
                  client.set("user:" + userName, JSON.stringify(userObj), function(error) {
                      if(error) {
                          res.send({"status" : 0, "message" : "Unable to create new user, please try again."});
                      } else {
                          req.session.userName = userName;
                          res.redirect('/');
                      }
                  })

                }
            }
        })
    } else {
        res.send({"status" : 0, "message" : "Username has to be atleast 8 characters long."});
    }
})

http.listen(port, function(){
    console.log('App started : listening on port ', port);
});
