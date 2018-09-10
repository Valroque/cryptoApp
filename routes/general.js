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
          res.send({ "status" : 1, "message" : "Address updated successfully"});
        } else {
          res.send({ "status" : 0, "message" : "There was some problem updating your wallet address. Please try again!" });
        }
      })

    } else {
      res.send({ "status" : 0, "message" : "There was some problem updating your wallet address. Please try again!" });
    }
  })
})

router.route('/addINR')
.post(function(req, res) {
  var amount = parseInt(req.body.amountINR);
  var userName = req.session.userName;

  client.get("user:"+userName, function(error, data) {
    data = JSON.parse(data);
    data.INR += amount;

    client.set("user:"+userName, JSON.stringify(data), function(error) {
      if(!error) {
        res.send({ "status" : 1, "balanceINR" : data.INR});
      } else {
        res.send({ "status" : 0, "message" : "There was some problem add INR. Please try again!" });
      }
    })
  })

})

router.route('/getReceiverData')
.post(function(req, res) {
  var receiverName = req.body.userName;

  client.get('user:'+ receiverName, function(error, data) {
    if(!error && data) {
      data = JSON.parse(data);
      res.send({ 'status' : 1, 'receiverData' : {
                                                    walletAddress : data.walletAddress,
                                                    INR : data.INR
                                                }
      });
    } else {
      res.send({ 'status' : 0, 'message' : 'Receiver does not exists with us.' });
    }
  })
})

module.exports = router;
