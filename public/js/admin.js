const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('https://ropsten.infura.io/v3/0e2d13cc05494cd989d5daa04d69a0e9'));

$(document).ready(function() {
  $.ajax({
    'url' : '/admin/getData',
    'type' : 'GET',
    'success' : function(data) {
      if(data.status == 0) {
        alert(data.message);
      } else {
        window.localStorage.setItem('adminData', JSON.stringify(data.adminData));
        var adminData = data.adminData;

        if(adminData.walletAddress) {
          $('#currentAddress').text(adminData.walletAddress);
          $('#currentAddress').css({'color' : '#2f76eb'});
          $('#transaction').show();
        } else {
          $('#currentAddress').text("Please update your wallet address.");
          $('#currentAddress').css({'color' : 'red'});
          $('#transaction').hide();
        }
        $('#balanceINR').text(adminData.INR);
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

$('#sendTransaction').click(function() {
  if(confirm("Are you sure?")) {
    var adminData = JSON.parse(window.localStorage.getItem('adminData'));

    web3.eth.getTransactionCount(adminData.walletAddress, function (error, nonce) {
        if(error) {
            alert(error);
        } else {
            console.log(nonce);
            var tokenAddress = $('#trxnCurrency').val() || '0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413';
            var privateKey = new EthJS.Buffer.Buffer($('#trxnPrvtKey').val(), 'hex');
            var gasPrice = '0x' + web3.eth.gasPrice.toString(16);
            var gas = '0x' + web3.toHex(web3.toWei($('#trxnGas').val(), 'ether'));
            var value = web3.toHex(web3.toWei($('#trxnAmount').val(), 'ether'));
            var receiver = $('#trxnReceiver').val();
            //console.log(tokenAddress, privateKey, gasPrice, gas, value);
            $.ajax({
                'type' : 'GET',
                'url' : 'https://api.etherscan.io/api?module=contract&action=getabi&address=' + tokenAddress,
                'success' : function(abiData) {
                  var abi = "";
                  abi = JSON.parse(abiData.result);

                  if(abi) {
                      contract = web3.eth.contract(abi).at(tokenAddress);
                      var data = contract.transfer.getData(receiver, 10000, {from: adminData.walletAddress});

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
                      //console.log(serializedTx);
                      web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), function(error, hash) {
                         if (!error) {
                            alert('Your transaction has been initiated. You can find the link to monitor the progress.');
                            $('#trxnHash').remove();
                            $('.transaction').append('<a id="trxnHash" style="text-decoration: none;" href="' +
                            'https://ropsten.etherscan.io/tx/' + hash + '">View Transaction Status</a>');
                         } else {
                            alert(error)
                         }
                      });
                  } else {
                      alert('Error Proceeding with the transaction.');
                  }
                }
            })
        }
    });

  }
})

var updateWallet = function() {
  var newAddress = $('#updateWallet').val();

  if(web3.isAddress(newAddress) && newAddress != $('#currentAddress').val()) {
    $.ajax({
      'type' : 'POST',
      'url' : '/admin/updateWallet',
      'data' : {
        'walletAddress' : newAddress
      },
      'success' : function(data) {
        if(data.status == 1) {
          var adminData = JSON.parse(window.localStorage.getItem('adminData'));
          adminData.walletAddress = newAddress;
          window.localStorage.setItem('adminData', JSON.stringify(adminData));
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
      'url' : '/admin/addINR',
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
          var adminData = JSON.parse(window.localStorage.getItem('adminData'));

          if (contractABI != ''){
              var MyContract = web3.eth.contract(contractABI).at(tokenAddress);
              var balance = MyContract._eth.getBalance(adminData.walletAddress).toString(10)/Math.pow(10,18);

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
