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
          var adminData = data.userData;

          if(adminData.walletAddress) {
            $('#currentAddress').text(adminData.walletAddress);
          } else {
            $('#currentAddress').text("Admin please update your wallet address.");
            $('#currentAddress').css({'color' : 'red'});
          }

          $('.currencies table').append(
            '<tr>' +
                '<td>INR</td>' +
                '<td>'+adminData.balanceINR+'</td>' +
            '</tr>'
          );
          for(var i=0;i<adminData.crypto.length;i++) {
            //populate the currencies in the table
          }
        }
      }
  })

  $('#updateWallet').click(function() {
    var newAddress = $('.adminWallet input').val();

    if(validAddress(newAddress)) {
      $.ajax({
        'url' : '/user/update',
        'type' : 'POST',
        data : {
          walletAddress : newAddress
        },
        success : function(data) {
          if(data.status == 0) {
            alert(data.message);
          }
        }
      })
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
})
