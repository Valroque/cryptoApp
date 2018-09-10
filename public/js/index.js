const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('https://ropsten.infura.io/v3/0e2d13cc05494cd989d5daa04d69a0e9'));

$(document).ready(function() {
  $.ajax({
    'url' : '/user/getData',
    'type' : 'GET',
    'success' : function(data) {
      if(data.status == 0) {
        alert(data.message);
      } else {
        window.localStorage.setItem('userData', JSON.stringify(data.userData));
        var userData = data.userData;
        $('.main div h4').text('Welcome ' + userData.userName);

        $('#'+userData.userName).remove();

        if(userData.walletAddress) {
          $('#currentAddress').text(userData.walletAddress);
          $('#currentAddress').css({'color' : '#2f76eb'});
          $('#transaction').show();
        } else {
          $('#currentAddress').text("Please update your wallet address.");
          $('#currentAddress').css({'color' : 'red'});
          $('#transaction').hide();
        }
        $('#balanceINR').text(userData.INR);
      }
    }
  })

  $.ajax({
    url : '/getUserList',
    success : function(data) {
      if(data.status == 0) {
        alert(data.message);
      } else {
        var userName = JSON.parse(window.localStorage.getItem('userData')).userName;

        for(var i=0; i<data.users.length; i++) {
          if(userName == data.users[i]){
            continue;
          }
          var option = document.createElement('option');
          option.text = data.users[i];
          option.id = data.users[i];
          $('#trxnReceiver').append(option);
        }
      }
    }
  })
})

var logout = function() {
  $.ajax({
    'url' : '/logout',
    'type' : 'GET',
    'success' : function() {
      window.location.reload();
    }
  })
}

var sendTransaction = function() {
  if(confirm("Are you sure?")) {
    var userData = JSON.parse(window.localStorage.getItem('userData'));

    web3.eth.getTransactionCount(userData.walletAddress, function (error, nonce) {
        if(error) {
            alert(error);
        } else {
            $.ajax({
              'type' : 'POST',
              'url' : '/user/getReceiverData',
              'data' : {
                'userName' : $('#trxnReceiver :selected').val()
              },
              'success' : function(data) {
                if(data.staus == 0) {
                  alert(data.message);
                } else {
                  var equINRValue = $('#trxnAmount').val() * 100; //assuming 1 ether = 100INR
                  var receiver = data.receiverData.walletAddress;
                  var reveiverINRBalance = data.receiverData.INR;

                  if(reveiverINRBalance >= equINRValue) {
                      proceedTransaction(receiver, userData);
                  } else {
                      alert('Receiver has indequet INR');
                  }
                }
              }
            })
        }
    });
  }
}

var proceedTransaction(receiver, userData) {
    var tokenAddress = $('#trxnCurrency').val() || '0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413';
    var privateKey = new EthJS.Buffer.Buffer($('#trxnPrvtKey').val(), 'hex');
    var gasPrice = '0x' + web3.eth.gasPrice.toString(16);
    var gas = '0x' + web3.toHex(web3.toWei($('#trxnGas').val(), 'ether'));
    var value = web3.toHex(web3.toWei($('#trxnAmount').val(), 'ether'));

    $.ajax({
        'type' : 'GET',
        'url' : 'https://api.etherscan.io/api?module=contract&action=getabi&address=' + tokenAddress,
        'success' : function(abiData) {
            var abi = "";
            abi = JSON.parse(abiData.result);

            if(abi) {
                contract = web3.eth.contract(abi).at(tokenAddress);
                var data = contract.transfer.getData(receiver, 10000, {from: userData.walletAddress});

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
                      $('.transaction').append('<a id="trxnHash" style="text-decoration: none;" href="' +
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
        }
    })
}

var updateINR = function() {
    $.ajax({
      'type' : 'GET',
      'url' : '/user/getINRBalance',
      'success' : function(data) {
        if(data.status == 1) {
          return data.balanceINR;
        }
      }
    })
}

var updateWallet = function() {
  var newAddress = $('#updateWallet').val();

  if(web3.isAddress(newAddress) && newAddress != $('#currentAddress').val()) {
    $.ajax({
      'type' : 'POST',
      'url' : '/user/updateWallet',
      'data' : {
        'walletAddress' : newAddress
      },
      'success' : function(data) {
        if(data.status == 1) {
          var userData = JSON.parse(window.localStorage.getItem('userData'));
          userData.walletAddress = newAddress;
          window.localStorage.setItem('userData', JSON.stringify(userData));
          $('#currentAddress').text(newAddress);
        }

        alert(data.message);
      }
    })
  } else {
    alert("Please enter a valid address to change.");
  }
}

var addINR = function() {
  var amount = parseInt($('#addINR').val());

  if(amount > 0) {
    $.ajax({
      'type' : 'POST',
      'url' : '/user/addINR',
      'data' : {
        'amountINR' : amount
      },
      'success' : function(data) {
        if(data.status == 0) {
          alert(data.message);
        } else {
          $('#balanceINR').text(data.balanceINR);
          alert('Balance has been updated');
        }
      }
    })
  } else {
    alert('Please check the amount entered. Value should be greater than 0');
  }
}

var calculateEtherBalance = function() {
  $('#balanceCurrency').val('0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413');
  calculateBalance();
}

var calculateBalance = function() {
  var tokenAddress = $('#balanceCurrency').val();

  $.ajax({
    'type' : 'GET',
    'url' : 'https://api.etherscan.io/api?module=contract&action=getabi&address='+tokenAddress,
    'success' : function(data) {
      if(data.status == 0) {
        alert(data.result);
        $('#balanceAmount').text(data.result);
      } else {
          var contractABI = JSON.parse(data.result);
          var userData = JSON.parse(window.localStorage.getItem('userData'));

          if (contractABI != ''){
              var MyContract = web3.eth.contract(contractABI).at(tokenAddress);
              var balance = MyContract._eth.getBalance(userData.walletAddress).toString(10)/Math.pow(10,18);

              if(balance || balance == 0) {
                $('#balanceAmount').text("Balance : " + balance);
              } else {
                alert('We are having some issue, please try again later.');
              }

          } else {
              console.log("Error" );
          }
      }
    }
  })
}
