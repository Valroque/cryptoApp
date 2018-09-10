var redis = require("redis");
var redisServer = {
  'host' : 'localhost',
  'port' : '6379'
}
var client = redis.createClient(redisServer);
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/0e2d13cc05494cd989d5daa04d69a0e9'));
var rate = 100;//1 ether = 100rs
var transactionLimit = 100000;

exports.client = client;
exports.web3 = web3;
exports.transactionLimit = transactionLimit;
