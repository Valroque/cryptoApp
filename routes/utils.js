var redis = require("redis");
var redisServer = {
  'host' : 'localhost',
  'port' : '6379'
}
var client = redis.createClient(redisServer);
exports.client = client;
