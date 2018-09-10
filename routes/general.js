var utils = require('./utils.js');
var client = utils.client;
var router = require('express').Router();
var web3 = utils.web3;
var rate = utils.rate;
var async = require('async');

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

router.route('/getINRBalance')
.get(function(req, res) {
  var userName = req.session.userName;

  client.get("user:"+userName, function(error, data) {
    if(!error && data) {
      data = JSON.parse(data);
      res.send({ "status" : 1, "balanceINR" : data.INR });

    } else {
      console.log(error);
      res.send({ "status" : 0, "message" : "Error fetching INR balance." });
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

router.route('/tradeINR')
.post(function(req, res) {
  var receiver = req.body.reveiver;
  var sender = req.body.sender;
  var transactionHash = req.body.transactionHash;

  web3.eth.getTransaction(transactionHash, function(error, data) {

    if(!error && data && receiver == data.to && sender == data.from) {
        var INRValue = parseInt(data.value.toString(10))*rate;
    } else {

        async.parallel([
            function(callback) {
                client.get('transactions', funtion(error, data) {
                    if(!error && data) {
                        data = JSON.parse(data);
                        data.transactionList.push(transaction);

                        client.set('transactions', JSON.stringify(data), function(error) {
                            if(error) {
                                callback(error, null);
                            } else {
                              callback(null, null)
                            }
                        })
                    }
                })
            },
            function(callback) {
                client.get('user:' + receiver, function(error, receiverData) {
                    receiverData = JSON.parse(receiverData);
                    receiverData.INR -= INRValue;

                    client.set('user:' + receiver, JSON.stringify(receiverData), function(error) {
                        if(error) {
                            callback(error, null);
                        } else {
                          callback(null, null)
                        }
                    })
                })
            },
            function(callback) {
                client.get('user:' + sender, function(error, senderData) {
                    senderData = JSON.parse(senderData);
                    senderData.INR += INRValue;

                    client.set('user:' + sender, JSON.stringify(senderData), function(error) {
                        if(error) {
                            callback(error, null);
                        } else {
                          callback(null, null)
                        }
                    })
                })
            }
        ], function(error) {
            if(error) {
              console.log(error);
              res.send({ 'status' : 0, 'message' : 'Transaction failed at some point.' });
            } else {
              res.send({ 'status' : 1, 'message' : 'Transaction completed'});
            }
        })
      }
  })
})

module.exports = router;
