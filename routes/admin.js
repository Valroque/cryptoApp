var utils = require('./utils.js');
var client = utils.client;
var router = require('express').Router();

router.route('/getData')
.get(function(req, res) {
  client.get("user:Admin", function(error, data) {
    if(!error && data) {

    } else {

    }
  })
})

module.exports = router;
