$(document).ready(function() {
  $.ajax({
    url : '/getUserList',
    success : function(data) {
      if(data.status == 0) {
        alert(data.message);
      } else {
        for(var i=0; i<data.users.length; i++) {
          var option = document.createElement('option');
          option.text = data.users[i];
          option.id = data.users[i];
          $('#userList').append(option);
        }
      }
    }
  })

  $("#createNewUser").click(function() {
    var userName = prompt("Enter the User Name!");

    if(userName == undefined || userName.length < 8) {
      alert("Username not valid. It has to be 8 charactes long.");
    } else {
      $.ajax({
        url: '/newUser',
        data: {
          userName : userName
        },
        success : function(data) {
          if(data.status == 0) {
            alert(data.message);
          } else {
            window.location.reload();
          }
        }
      })
    }
  })


  $('#loginBtn').click(function() {
    $.ajax({
      'url' : '/login',
      'type' : 'POST',
      'data' : {
        'userName' : $('#userList :selected').text()
      },
      'success' : function(data) {
        if(data.status == 0) {
          alert(data.message);
        } else {
            window.location.reload();
        }
      }
    })
  })
})
