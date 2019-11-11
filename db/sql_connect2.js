require('../config/config')
const sql = require("mssql");
const config = {
    user: process.env.user2,
    password: process.env.password2,
    server: process.env.server2, // You can use 'localhost\\instance' to connect to named instance
    database: process.env.database2,

    options: {
        encrypt: true // Use this if you're on Windows Azure
    }
};
const connection2 = new sql.ConnectionPool(config);

module.exports = { connection2 };