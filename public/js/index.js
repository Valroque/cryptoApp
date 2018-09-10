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
        // $('.currencies table').append(
        //   '<tr>' +
        //       '<td>INR</td>' +
        //       '<td>'+userData.balanceINR+'</td>' +
        //   '</tr>'
        // );
        //
        // for(var i=0;i<userData.crypto;i++) {
        //   //populate the currencies in the table
        // }
      }
    }
  })
})

$('#logout').click(function() {
  $.ajax({
    'url' : '/logout',
    'type' : 'GET',
    'success' : function() {
      window.location.reload();
    }
  })
})

$('#sendTransaction').click(function() {
  if(confirm("Are you sure?")) {
    // var transactionData = {
    //   trxnPrvtKey : $('#trxnPrvtKey').val(),
    //   trxnReceiver : $('#trxnReceiver').val(),
    //   trxnAmount : $('#trxnAmount').val(),
    //   trxnCurrency : ,
    //   trxnGas : $('#trxnGas').val()
    // }

    var userData = JSON.parse(window.localStorage.getItem('userData'));

    web3.eth.getTransactionCount(userData.walletAddress, function (error, nonce) {
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
