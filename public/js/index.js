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

        $('.currencies table').append(
          '<tr>' +
              '<td>INR</td>' +
              '<td>'+userData.balanceINR+'</td>' +
          '</tr>'
        );

        for(var i=0;i<userData.crypto;i++) {
          //populate the currencies in the table
        }
      }
    }
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
      var transactionData = {
        trxnPrvtKey : $('#trxnPrvtKey').val(),
        trxnReceiver : $('#trxnReceiver').val(),
        trxnAmount : $('#trxnAmount').val(),
        trxnCurrency : $('#trxnCurrency').val() || '0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413',
        trxnGas : $('#trxnGas').val()
      }

      console.log(transactionData);
    }
  })
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
        alert(data.message);
        $('#currentAddress').text(newAddress);
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
              $('#balanceAmount').text("Balance :" + MyContract._eth.getBalance(userData.walletAddress).toString(10)/Math.pow(10,18));
          } else {
              console.log("Error" );
          }
      }
    }
  })
}
