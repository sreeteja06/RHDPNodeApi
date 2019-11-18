/*
 * SPDX-License-Identifier: Apache-2.0
 *         _____________  ___  
 *        / ___/ ___/ _ \/ _ \ 
 *      (__  ) /  /  __/  __/ 
 *     /____/_/   \___/\___  
 * File Created: Monday, 18th November 2019 2:58:28 pm
 * Author: SreeTeja06 (sreeteja.muthyala@gmail.com)

 */
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const { poolPromise } = require("../db/sql_connect");
const { authenticate } = require("../middleware/authenticate");

const awaitHandler = fn => {
  return async (req, res, next) => {
    try {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};

router.post("/sendJoinRequest", (req, res) => {
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
            "insert into tempUser (email, password, name, phone) values('" +
              req.body.email +
              "','" +
              password +
              "', '" +
              req.body.name +
              "'," +
              req.body.phone +
              ")"
          );
        result = await pool
          .request()
          .query(
            "select tempUserID from tempUser where email = '" +
              req.body.email +
              "'"
          );
        const tempUserID = result.recordset[0].tempUserID;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.send({ tempUserID: tempUserID, email: req.body.email });
      } catch (err) {
        console.log(err);
        res.status(500).send(err);
      }
    });
  });
});

router.get(
  "/getJoinRequests",
  authenticate,
  awaitHandler(async (req, res) => {
    let pool = await poolPromise;
    let response = await pool.request().query("select * from tempUser");
    console.log(response.recordset);
    res.send(response.recordset);
  })
);

router.post(
  "/acceptJoinRequest",
  authenticate,
  awaitHandler(async (req, res) => {
    if (req.userID == 2) {
      let pool = await poolPromise;
      let testResponse = await pool
      .request()
      .query(`select * from tempUser where tempUserID = ${req.body.tempUserID}`);
      if(testResponse.recordset.length <= 0){
        res.status(409).send({err: "no such temp user"})
      }else{
      let response = await pool
        .request()
        .query(`exec acceptUserRequest @inTempUserID = ${req.body.tempUserID}`);
      res.send(response);
      }
    } else {
      res.status(203).send({ err: "user unauthorized" });
    }
  })
);

router.delete(
  "/denyJoinRequest",
  authenticate,
  awaitHandler(async (req, res) => {
    if (req.userID == 2) {
      let pool = await poolPromise;
      let testResponse = await pool
      .request()
      .query(`select * from tempUser where tempUserID = ${req.body.tempUserID}`);
      if(testResponse.recordset.length <= 0){
        res.status(409).send({err: "no such temp user"})
      }else{
      let response = await pool
        .request()
        .query(`delete from tempUser where tempUserID = ${req.body.tempUserID}`);
      res.send(response);
      }
    } else {
      res.status(203).send({ err: "user unauthorized" });
    }
  })
);

module.exports = router;
