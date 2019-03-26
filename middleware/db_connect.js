let { connection } = require('../db/sql_connect');

let db_connect = async (req, res, next) => {
    try {
      let db = await connection();
      req.db = db;
      next();
    } catch (err) {
      res.status(400).send(err);
    }
}

module.exports = {db_connect};