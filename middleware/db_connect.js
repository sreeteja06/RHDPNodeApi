let { connection } = require('../db/sql_connect');
const sql = require("mssql");

let db_connect = async (req, res, next) => {
    try {
      // await sql.close();
      let db = await connection();
      req.db = db;
      next();
    } catch (err) {
      await sql.close();
      res.status(400).send(err);
    }
}

module.exports = {db_connect};

