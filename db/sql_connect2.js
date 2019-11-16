require('../config/config')
const sql = require("mssql");
const config = {
    user: process.env.user2,
    password: process.env.password2,
    server: process.env.server2, // You can use 'localhost\\instance' to connect to named instance
    database: process.env.database2,

    options: {
        encrypt: true // Use this if you're on Windows Azure
    },
    pool:{
        max: 30,
    }
};

const poolPromise2 = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log(`Connected to ${process.env.database2} database`)
    return pool
  })
  .catch(err => console.log('Database Connection Failed! Bad Config: ', err))


module.exports = { poolPromise2 }