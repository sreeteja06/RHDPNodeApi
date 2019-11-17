/*
 * SPDX-License-Identifier: Apache-2.0
 *         _____________  ___  
 *        / ___/ ___/ _ \/ _ \ 
 *      (__  ) /  /  __/  __/ 
 *     /____/_/   \___/\___  
 * File Created: Sunday, 17th November 2019 2:58:28 pm
 * Author: SreeTeja06 (sreeteja.muthyala@gmail.com)

 */
const express = require("express");
const router = express.Router();

const { poolPromise } = require("../db/sql_connect");
const { authenticate } = require("../middleware/authenticate");

router.get("/jAccessList", authenticate, async (req, res) => {
  let pool;
  try {
    if (req.userID == 2) {
      pool = await poolPromise;
      let jAccess = await pool.request().query(
        `select users.userID, users.name, users.email,jAccess.JID, 
        junctionPoint.junctionName, junctionPoint.city 
        from junctionPoint, users, jAccess where junctionPoint.JID = jAccess.JID 
        and users.userID = jAccess.UserID`
      );
      console.log(jAccess.recordset);
      res.send(jAccess.recordset);
    } else {
      res.status(203).send({ err: "not an admin" });
    }
  } catch (e) {
    console.log(e);
    res.status(500).end(e);
  }
});

router.get("/getAllJRequests", authenticate, async (req, res) => {
  let pool;
  if (req.userID != 2) {
    res.status(203).send({ err: "user unauthorized" });
  } else {
    try {
      pool = await poolPromise;
      let requests = await pool.request()
        .query(`select jAccessReqList.reqID, users.userID, users.name, users.email,jAccessReqList.JID, 
      junctionPoint.junctionName, junctionPoint.city 
      from junctionPoint, users, jAccessReqList where junctionPoint.JID = jAccessReqList.JID 
      and users.userID = jAccessReqList.UserID and jAccessReqList.reqStatus = 0`);
      res.send(requests.recordset);
    } catch (e) {
      console.log(e);
      res.status(500).end(e);
    }
  }
});

router.post("/requestLocationAccess", authenticate, async (req, res) => {
  let pool;
  try {
    pool = await poolPromise;
    let requests = await pool.request()
      .query(`insert into jAccessReqList (JID, userID) values (${req.body.JID}, ${req.userID})`);
    res.send(requests);
  } catch (e) {
    console.log(e);
    res.status(500).end(e);
  }
});

router.post("/acceptLocationRequest", authenticate, async (req, res)=>{
  let pool;
  if (req.userID != 2) {
    res.status(203).send({ err: "user unauthorized" });
  } else {
    try {
      pool = await poolPromise;
      let response = await pool.request()
        .query(`exec acceptJAccessRequest @inReqID = ${req.body.reqID}`);
      res.status(200);
    } catch (e) {
      console.log(e);
      res.status(500).end(e);
    }
  }
})

router.post("/login", async (req, res) => {});

module.exports = router;
