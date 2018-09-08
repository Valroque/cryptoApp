var utils = require('./utils.js');
var client = utils.client;
var router = require('express').Router();

router.route('/getData')
.get(function(req, res) {
  var userName = req.session.userName;

  client.get("user:"+userName, function(error, data) {
    if(!error && data) {
      data = JSON.parse(data);
      res.send({ "status" : 1, "userData": data })
    } else {
      req.session.destroy();
      res.sendFile(path.resolve(__dirname, "../views/login.html"));
    }
  })
})

router.route('/updateWallet')
.post(function(req, res) {
  var newAddress = req.body.walletAddress;
  var userName = req.session.userName;

  client.get("user:"+userName, function(error, data) {
    if(!error && data) {
      data = JSON.parse(data);
      data.walletAddress = newAddress;

      client.set("user:"+userName, JSON.stringify(data), function(error) {
        if(!error) {
          res.send({ "status":1, "message" : "Address updated successfully"});
        } else {
          res.send({ "status" : 0, "message" : "There was some problem updating your wallet address. Please try again!" });
        }
      })

    } else {
      res.send({ "status" : 0, "message" : "There was some problem updating your wallet address. Please try again!" });
    }
  })
})

module.exports = router;
