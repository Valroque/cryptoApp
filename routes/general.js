var utils = require('./utils.js');
var client = utils.client;
var router = require('express').Router();

router.route('/getData')
.get(function(req, res) {
  var userName = req.session.userName;

  client.get("user:"+userName, function(error, data) {
    if(!error && data) {
      data = JSON.parse(data);
      res.send({ "status":1, "userData":{
            "userName" : userName,
            "INR" : data.INR
        }
      })
    } else {
      req.session.destroy();
      res.sendFile(path.resolve(__dirname, "../views/login.html"));
    }
  })
})

module.exports = router;
