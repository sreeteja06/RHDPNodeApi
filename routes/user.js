const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require("bcryptjs");

const { generateAuthToken, decodeAuthToken } = require("../helpers/authToken");
const { db_connect } = require("../middleware/db_connect");
const { authenticate } = require("../middleware/authenticate");

router.post("/signUp", db_connect, (req, res) => {
    let password;
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            res.send(500).send(err);
        }
        bcrypt.hash(req.body.password, salt, async (err, hash) => {
            if (err) {
                res.send(500).send(err);
            }
            password = hash;
            try {
                req.on('close', async (err) => {
                    await sql.close();
                });
                let result = await req.db.query(
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
                result = await req.db.query(
                    "select userID from users where email = '" + req.body.email + "'"
                );
                const userID = result.recordset[0].userID;
                const token = generateAuthToken(userID, "auth");
                result = await req.db.query(
                    "insert into tokens (userID, token, access) values(" +
                    userID +
                    ",'" +
                    token +
                    "','" +
                    "auth" +
                    "')"
                );
                await sql.close();
                res
                    .header("x-auth", token)
                    .send({ userID: userID, email: req.body.email });
            } catch (err) {
                await sql.close();
                res.send(err);
            }
        });
    });
});

router.post("/login", db_connect, async (req, res) => {
  const password = req.body.password;
  const email = req.body.email;

  try {
    req.on("close", async err => {
      await sql.close();
    });
    let result = await req.db.query(
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
    await req.db.query("delete from tokens where userID = '" + userID + "'");
    bcrypt.compare(
      password,
      result.recordset[0].password,
      async (err, resp) => {
        try {
          if (resp) {
            const token = generateAuthToken(userID, "auth");
            result = await req.db.query(
              "insert into tokens (userID, token, access) values(" +
                userID +
                ",'" +
                token +
                "','" +
                "auth" +
                "')"
            );
            const decoded = decodeAuthToken(token);
            // console.log(result);
            await sql.close();
            res.send({ userID: userID, name, branch, exp: decoded.exp, token });
          } else {
            await sql.close();
            res.send(401);
          }
        } catch (e) {
          await sql.close();
          // console.log(e);
          res.status(401).send(e);
        }
      }
    );
  } catch (err) {
    console.log(err);
    await sql.close();
    res.status(401).end();
  }
});

router.delete(
  "/me/logout",
  [db_connect, authenticate],
  async (req, res) => {
    try {
      req.on("close", async err => {
        await sql.close();
      });
      const result = await req.db.query(
        "exec removeToken @inToken = '" + req.token + "'"
      );
      await sql.close();
      res.send(result);
    } catch (e) {
      await sql.close();
      res.status(500).send(e);
    }
  }
);

router.get("/me", [db_connect, authenticate], async (req, res) => {
  req.on("close", async err => {
    await sql.close();
  });
  await sql.close();
  res.send({ userID: req.userID });
});

module.exports = router;