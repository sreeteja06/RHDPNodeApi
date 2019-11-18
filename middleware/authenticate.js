const sql = require('mssql');
const jwt = require('jsonwebtoken');
let { poolPromise } = require('../db/sql_connect');

var authenticate = async (req, res, next) => {
  const token = req.header('x-auth');
  //checking of token validity and others are removed for now i.e. for develpment purpose
  try {
    if (!token) {
      throw 'No token Sent';
    }
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded);
    let pool = await poolPromise;
    let result = await pool
      .request()
      .query("exec findByToken @inToken = '" + token + "'");
    req.userID = result.recordset[0].userID;
    req.token = token;
    next();
  } catch (e) {
    console.log(e);
    res.status(401).send(e);
  }
};

module.exports = { authenticate };
