var utils = require('./utils.js');
var client = utils.client;
var web3 = utils.web3;
var rate = utils.rate;
var transactionLimit = utils.transactionLimit;
var router = require('express').Router();
var async = require('async');
var axios = require('axios');

router.route('/getData')
.get(function(req, res) {
  var userName = req.session.userName;

  client.get("user:"+userName, function(error, data) {    
    if(!error && data) {
      data = JSON.parse(data);
      data.rate = utils.rate;
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

router.route('/purchaseEther')
.post(function(req, res) {
  var value = parseInt(req.body.amountEther);
  var userName = req.session.userName;
  var tokenAddress = '0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413';

  client.get('user:admin', function(error, data) {
      if(!error && data) {
          data = JSON.parse(data);
          if(value < transactionLimit) {
              client.get('user:'+ userName, function(error, receiverData) {
                  receiverData = JSON.parse(receiverData);

                  var sender = data.walletAddress;
                  var receiver = receiverData.walletAddress;
                  var privateKey = data.privateKey;
                  var gasPrice = '0x' + web3.eth.gasPrice.toString(16);
                  var gas = '0x' + web3.toHex(web3.toWei(100, 'gwei'));

                  axios.get('https://api.etherscan.io/api?module=contract&action=getabi&address=' + tokenAddress)
                  .then(function(abiData) {
                      var abi = "";
                      abi = JSON.parse(abiData.result);

                      if(abi) {
                          contract = web3.eth.contract(abi).at(tokenAddress);
                          var data = contract.transfer.getData(receiver, amount, {from: userData.walletAddress});

                          var rawTx = {
                             nonce: nonce,
                             gasPrice: gasPrice,
                             gasLimit: gas,
                             to: receiver,
                             value: value,
                             data: data
                          }

                          var tx = new EthJS.Tx(rawTx);
                          tx.sign(privateKey);
                          var serializedTx = tx.serialize();

                          web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), function(error, hash) {
                             if (!error) {
                                alert('Your transaction has been initiated. You can find the link to monitor the progress.');
                                $('#trxnHash').remove();
                                $('.transactionEther').append('<a id="trxnHash" style="text-decoration: none;" href="' +
                                'https://ropsten.etherscan.io/tx/' + hash + '">View Transaction Status</a>');

                                $.ajax({
                                  'url' : '/user/tradeINR',
                                  'type' : 'POST',
                                  'data' : {
                                      'receiver' : userName,
                                      'sender' : userData.userName,
                                      'transactionHash' : hash
                                  },
                                  'success' : function(data) {
                                      alert(data.message);
                                      if(data.status == 1) {
                                          $('#balanceINR').text(updateINR());
                                      }
                                  }
                                })
                             } else {
                                alert(error)
                             }
                          });
                      } else {
                          alert('Error: Please Check the token address.');
                      }
                  })
                  .catch(function(error) {
                      console.log(error);
                  });
              })
          }
      }
  })
})

router.route('/tradeINR')
.post(function(req, res) {
  var receiver = req.body.receiver;
  var sender = req.body.sender;
  var transactionHash = req.body.transactionHash;

  web3.eth.getTransaction(transactionHash, function(error, data) {
    if(!error && data) {
        var INRValue = parseInt(data.value)/Math.pow(10,18)*100;

        async.parallel([
            function(callback) {
                client.get('transactions', function(error, data) {
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
                    if(receiverData.walletAddress != data.to) {
                      callback("Receiver address mismatch");
                    }
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
                    if(senderData.walletAddress != data.from) {
                      callback("Sender address mismatch");
                    }
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
        ], function(error, data) {
            if(error) {
              console.log(error);
              res.send({ 'status' : 0, 'message' : 'Transaction failed at some point.' });
            } else {
              res.send({ 'status' : 1, 'message' : 'Transaction completed'});
            }
        })
      } else {
        if(error)
          console.log(error);
        res.send({ 'status' : 0, 'message' : 'Transaction failed at some point.' });
      }
  })
})

module.exports = router;
