const express = require('express');
const router = express.Router();
const bcrypt = require("bcryptjs");

const { connection } = require('../db/sql_connect');
const { generateAuthToken, decodeAuthToken } = require("../helpers/authToken");
const { authenticate } = require("../middleware/authenticate");

router.post("/signUp", (req, res) => {
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
                req.on('close', async (err) => {
                    await pool.close();
                });
                pool = await connection.connect();
                let result = await pool.request().query(
                    "insert into users (email, password, name, phone) values('" +
                    req.body.email +
                    "','" +
                    password +
                    "', '" +
                    req.body.name +
                    "'," +
                    req.body.phone +
                    ")"
                );
                result = await pool.request().query(
                    "select userID from users where email = '" + req.body.email + "'"
                );
                const userID = result.recordset[0].userID;
                const token = generateAuthToken(userID, "auth");
                result = await pool.request().query(
                    "insert into tokens (userID, token, access) values(" +
                    userID +
                    ",'" +
                    token +
                    "','" +
                    "auth" +
                    "')"
                );
                await pool.close();
                res.setHeader( 'Content-Type', 'application/json; charset=utf-8' );
                res
                    .header("x-auth", token)
                    .send({ userID: userID, email: req.body.email });
            } catch (err) {
                console.log(err);
                await pool.close();
                res.status(500).send(err);
            }
        });
    });
});

router.post("/login", async (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  let pool;
  try {
    req.on("close", async err => {
      await pool.close();
    });
    pool = await connection.connect();
    let result = await pool.request().query(
      "select userID, password, name, branch from users where email = '" +
        email +
        "'"
    );
    if (result.recordset[0] === undefined) {
      throw "no email found";
    }
    const userID = result.recordset[0].userID;
    const name = result.recordset[0].name;
    const branch = result.recordset[0].branch;
    await pool.request().query("delete from tokens where userID = '" + userID + "'");
    bcrypt.compare(
      password,
      result.recordset[0].password,
      async (err, resp) => {
        try {
          if (resp) {
            const token = generateAuthToken(userID, "auth");
            result = await pool.request().query(
              "insert into tokens (userID, token, access) values(" +
                userID +
                ",'" +
                token +
                "','" +
                "auth" +
                "')"
            );
            const decoded = decodeAuthToken(token);
            await pool.close();
            res.setHeader( 'Content-Type', 'application/json; charset=utf-8' );
            res.send({ userID: userID, name, branch, exp: decoded.exp, token });
          } else {
            console.error("bcrypt compare:"+err);
            await pool.close();
            res.status(401).end();
          }
        } catch (e) {
          console.log("bcrypt compare:"+e);
          await pool.close();
          res.status(401).send(e);
        }
      }
    );
  } catch (err) {
    console.log(err);
    await pool.close();
    res.status(500).end();
  }
});

router.delete(
  "/me/logout",
  authenticate,
  async (req, res) => {
    let pool;
    try {
      req.on("close", async err => {
        await pool.close();
      });
      pool = await connection.connect();
      const result = await pool.request().query(
        "exec removeToken @inToken = '" + req.token + "'"
      );
      await pool.close();
      res.setHeader( 'Content-Type', 'application/json; charset=utf-8' );
      res.send(result);
    } catch (e) {
        console.log(e);
      await pool.close();
      res.status(500).send(e);
    }
  }
);

router.get("/me",  authenticate, async (req, res) => {
  res.setHeader( 'Content-Type', 'application/json; charset=utf-8' );
  res.send({ userID: req.userID });
});

module.exports = router;