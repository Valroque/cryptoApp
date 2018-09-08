$(document).ready(function() {
  $.ajax({
    'url' : '/user/getData',
    'type' : 'GET',
    'success' : function(data) {
      if(data.status == 0) {
        alert(data.message);
      } else {
        var userData = data.userData;
        $('.main div h4').text('Welcome ' + userData.userName);
        $('#currentAddress').text(userData.wallletAddress);
        $('.currencies table').append('
          <tr>
              <td>INR</td>
              <td>'+userData.balanceINR+'</td>
          </tr>
        ')

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
})
