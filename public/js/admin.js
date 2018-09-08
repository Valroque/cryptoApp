$(document).ready(function() {
  $.ajax({
      'url' : '/admin/getData',
      'type' : 'GET',
      'success' : function(data) {
        if(data.status == 0) {
          alert(data.message);
        } else {
          var adminData = data.userData;

          $('#currentAddress').text(adminData.wallletAddress || "Admin please add a wallet address.");
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

  $('#updateAddress').click(function() {
    var newAddress = $('.adminWallet input').val();

    if(validAddress(newAddress)) {
      $.ajax({
        'url' : '/user/update',
        'type' : 'POST',
        data : {
          wallletAddress : newAddress
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
