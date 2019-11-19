/* eslint-disable global-require */
const env = process.env.NODE_ENV || 'production';

if (env === 'test') {
  console.log('running test server');
  const config = require('./test.json');
  Object.keys(config).forEach(key => {
    process.env[key] = config[key];
  });
}

if (env === 'production') {
  const config = require('./config.json');
  Object.keys(config).forEach(key => {
    process.env[key] = config[key];
  });
}
