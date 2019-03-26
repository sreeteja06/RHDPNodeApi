require('../config/config')
const sql = require("mssql");

const config = {
    user: process.env.user,
    password: process.env.password,
    server: process.env.server, // You can use 'localhost\\instance' to connect to named instance
    database: process.env.database,

    options: {
        encrypt: true // Use this if you're on Windows Azure
    }
};
const connection = async () => {
    try{
        return await sql.connect(config);
    }catch(e){
        console.log(e);
    }
}

module.exports = { connection };