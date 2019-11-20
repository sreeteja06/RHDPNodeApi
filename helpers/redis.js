const redis = require('redis');

const redisClient = redis.createClient({
  port: process.env.REDISPORT,
  host: process.env.REDISURL,
  retry_strategy: () => 1000,
  password: process.env.REDISPASS
});

module.exports = { redisClient };
