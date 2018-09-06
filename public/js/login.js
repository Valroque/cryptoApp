console.log("here");
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
          option.id = i;
          $('#userList').append(option);
        }
      }
    }
  })

  $("#createNewUser").click(function() {
    $.ajax({
      url: '/newUser',
      data: {
        userNmae : prompt("Enter the User Name!");
      },
      success : function(data) {
        if(data.status == 0) {
          alert(data.message);
        }
      }
    })
  })
})
