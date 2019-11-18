const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const { poolPromise } = require('../db/sql_connect');
const { generateAuthToken, decodeAuthToken } = require('../helpers/authToken');
const { authenticate } = require('../middleware/authenticate');

const awaitHandler = fn => {
  return async (req, res, next) => {
    try {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};

/***
 * @description this api endpoint is used for signup of an new user, and logs him by creating the token
 * @param {string} email - req.body.email #requires to be unique
 * @param {string} password - req.body.password #the password is hashed and saved into table
 * @param {string} name - req.body.name
 * @param {string} phone - req.body.phone
 * @returns {Object} userId and Email #after successfully creating the auth token which expires in 12hr it returns the userid and email
 */
router.post('/signUp', (req, res) => {
  let password, pool;
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      console.log(err);
      res.send(500).send(err);
    }
    bcrypt.hash(req.body.password, salt, async (err, hash) => {
      if (err) {
        console.log(err);
        res.send(500).send(err);
      }
      password = hash;
      try {
        pool = await poolPromise;
        let result = await pool
          .request()
          .query(
            "insert into users (email, password, name, phone) values('" +
              req.body.email +
              "','" +
              password +
              "', '" +
              req.body.name +
              "'," +
              req.body.phone +
              ')'
          );
        result = await pool
          .request()
          .query(
            "select userID from users where email = '" + req.body.email + "'"
          );
        const userID = result.recordset[0].userID;
        const token = generateAuthToken(userID, 'auth');
        result = await pool
          .request()
          .query(
            'insert into tokens (userID, token, access) values(' +
              userID +
              ",'" +
              token +
              "','" +
              'auth' +
              "')"
          );
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res
          .header('x-auth', token)
          .send({ userID: userID, email: req.body.email });
      } catch (err) {
        console.log(err);
        res.status(500).send(err);
      }
    });
  });
});

/***
 * @description this api endpoint is used for login
 * @param {string} email - req.body.email
 * @param {string} password - req.body.password
 * @returns {Object} userID, name, branch, exp, token #after successfully creating the auth token which expires in 12hr it returns the userid and email
 */
router.post(
  '/login',
  awaitHandler(async (req, res) => {
    const password = req.body.password;
    const email = req.body.email;
    let pool;
    try {
      pool = await poolPromise;
      let result = await pool
        .request()
        .query(
          "select userID, password, name from users where email = '" +
            email +
            "'"
        );
      if (result.recordset[0] === undefined) {
        throw 'no email found';
      }
      const userID = result.recordset[0].userID;
      const name = result.recordset[0].name;
      await pool
        .request()
        .query("delete from tokens where userID = '" + userID + "'");
      bcrypt.compare(
        password,
        result.recordset[0].password,
        async (err, resp) => {
          try {
            if (resp) {
              const token = generateAuthToken(userID, 'auth');
              result = await pool
                .request()
                .query(
                  'insert into tokens (userID, token, access) values(' +
                    userID +
                    ",'" +
                    token +
                    "','" +
                    'auth' +
                    "')"
                );
              const decoded = decodeAuthToken(token);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              let jid = await pool
                .request()
                .query(
                  'select top (1) JID from jAccess where UserId = ' + userID
                );
              let JID;
              if (jid.recordset.length == 0) {
                JID = '';
              } else {
                JID = jid.recordset[0].JID;
              }
              res.send({
                userID: userID,
                name,
                exp: decoded.exp,
                token,
                JID: JID
              });
            } else {
              console.error('bcrypt compare:' + err);
              res.status(401).end();
            }
          } catch (e) {
            console.log('bcrypt compare:' + e);
            res.status(401).send(e);
          }
        }
      );
    } catch (err) {
      if (err === 'no email found') {
        res.status(401).send({ err: 'no email found' });
      } else {
        console.log(err);
        res.status(500).end();
      }
    }
  })
);

/***
 * @description this api endpoint is used for logout
 * @param {string} token - x-auth header
 */
router.delete(
  '/me/logout',
  authenticate,
  awaitHandler(async (req, res) => {
    let pool;
    try {
      pool = await poolPromise;
      const result = await pool
        .request()
        .query("exec removeToken @inToken = '" + req.token + "'");
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(result);
    } catch (e) {
      console.log(e);
      res.status(500).send(e);
    }
  })
);

router.get('/me', authenticate, async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send({ userID: req.userID });
});

module.exports = router;
