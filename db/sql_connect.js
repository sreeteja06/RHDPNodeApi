require('../config/config');
const sql = require('mssql');

const config = {
  user: process.env.user,
  password: process.env.password,
  server: process.env.server, // You can use 'localhost\\instance' to connect to named instance
  database: process.env.database,

  options: {
    encrypt: true // Use this if you're on Windows Azure
  },
  pool: {
    max: 30
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log(`Connected to ${process.env.database} database`);
    return pool;
  })
  .catch(err => console.log('Database Connection Failed! Bad Config: ', err));

module.exports = {
  sql,
  poolPromise
};
