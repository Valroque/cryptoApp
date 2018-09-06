var express = require('express');
var app = express();
var path = require('path');
var redis = require('redis');
var bodyParser = require('body-parser');
var client = redis.createClient();
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
  res.sendFile(path.resolve(__dirname, './views/index.html'));
})

app.get('/getUserList', function(req, res) {
  client.get("users", function(error, data) {
    if(error) {
      res.send({"status" : 0, "message" : "We are facing some issue, please comeback in some time"});
    } else {
      console.log(data);
      res.send({"status" : 1, "users" : ["A", "B", "C"]});
    }
  })
})

app.get('/newUser', function(req, res) {
  var userNmae = req.body.userName;
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
            data.push(userName);
            client.set("users", JSON.stringify(data), function(error) {
              if(error) {
                res.send({"status" : 0, "message" : "Unable to create new user, please try again."});
              }
            })
          } else {
            res.send({"status" : 0, "message" : "Unable to create new user, please try again."});
          }
        })

        //create the new "userName" object in the db
        client.set("user:" + userName, JSON.stringify({'userName' : userName}), function(error) {
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
})

http.listen(port, function(){
  console.log('App started : listening on port ', port);
});
