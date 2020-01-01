// const jwt = require('jsonwebtoken');
const { poolPromise } = require('../db/sql_connect');

const authenticate = async (req, res, next) => {
  const token = req.header('x-auth');
  // checking of token validity and others are removed for now i.e. for develpment purpose
  try {
    if (!token) {
      // eslint-disable-next-line no-throw-literal
      throw 'No token Sent';
    }
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded);
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(`exec findByToken @inToken = '${token}'`);
    req.userID = result.recordset[0].userID;
    req.token = token;
    next();
  } catch (e) {
    console.log(e);
    res.status(401).send(e);
  }
};

module.exports = { authenticate };
