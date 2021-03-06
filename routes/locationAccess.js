/*
 * SPDX-License-Identifier: Apache-2.0
 *         _____________  ___  
 *        / ___/ ___/ _ \/ _ \ 
 *      (__  ) /  /  __/  __/ 
 *     /____/_/   \___/\___  
 * File Created: Sunday, 17th November 2019 2:58:28 pm
 * Author: SreeTeja06 (sreeteja.muthyala@gmail.com)

 */
const express = require('express');

const router = express.Router();

const { poolPromise } = require('../db/sql_connect');
const { authenticate } = require('../middleware/authenticate');
const slackBot = require('../helpers/slackBot');

const awaitHandler = fn => {
  return async (req, res, next) => {
    try {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      await fn(req, res, next);
    } catch (err) {
      console.log(err);
      slackBot(`${err.message} ${err.stack}`);
      next(err);
    }
  };
};

router.get(
  '/jAccessList',
  authenticate,
  awaitHandler(async (req, res) => {
    let pool;
    try {
      if (req.userID == process.env.ADMINUID) {
        pool = await poolPromise;
        const jAccess = await pool.request().query(
          `select users.userID, users.name, users.email,jAccess.JID, 
        junctionPoint.junctionName, junctionPoint.city 
        from junctionPoint, users, jAccess where junctionPoint.JID = jAccess.JID 
        and users.userID = jAccess.UserID`
        );
        console.log(jAccess.recordset);
        res.send(jAccess.recordset);
      } else {
        res.status(203).send({ err: 'not an admin' });
      }
    } catch (e) {
      console.log(e);
      slackBot(`${e.message} ${e.stack}`);
      res.status(500).end(e);
    }
  })
);

router.get(
  '/getLocationStatusForUsersADMIN',
  authenticate,
  awaitHandler(async (req, res) => {
    let pool;
    if (req.userID != process.env.ADMINUID) {
      res.status(203).send({ err: 'user unauthorized' });
    } else {
      try {
        pool = await poolPromise;
        const requests = await pool.request().query(`SELECT CASE
        WHEN JP.JID = JA.JID
           THEN 1
           ELSE 0
        END AS access, JP.junctionName, JP.city, JP.JID
        FROM jAccess as JA 
        RIGHT JOIN junctionPoint as JP 
        ON JA.JID = JP.JID and JA.UserId = ${req.query.userID}`);
        res.send(requests.recordset);
      } catch (e) {
        console.log(e);
        slackBot(`${e.message} ${e.stack}`);
        res.status(500).end(e);
      }
    }
  })
);

router.get(
  '/getLocationStatusForUser',
  authenticate,
  awaitHandler(async (req, res) => {
    let pool;
    try {
      pool = await poolPromise;
      const requests = await pool.request().query(`SELECT CASE
      WHEN JP.JID = JA.JID
         THEN 1
         ELSE 0
      END AS access, JP.junctionName, JP.city, JP.JID
      FROM jAccess as JA 
      RIGHT JOIN junctionPoint as JP 
      ON JA.JID = JP.JID and JA.UserId = ${req.userID}`);
      res.send(requests.recordset);
    } catch (e) {
      console.log(e);
      slackBot(`${e.message} ${e.stack}`);
      res.status(500).end(e);
    }
  })
);

router.get(
  '/getAllJRequests',
  authenticate,
  awaitHandler(async (req, res) => {
    let pool;
    if (req.userID != process.env.ADMINUID) {
      res.status(203).send({ err: 'user unauthorized' });
    } else {
      try {
        pool = await poolPromise;
        const requests = await pool.request()
          .query(`select jAccessReqList.reqID, users.userID, users.name, users.email,jAccessReqList.JID, 
      junctionPoint.junctionName, junctionPoint.city 
      from junctionPoint, users, jAccessReqList where junctionPoint.JID = jAccessReqList.JID 
      and users.userID = jAccessReqList.UserID`);
        res.send(requests.recordset);
      } catch (e) {
        console.log(e);
        slackBot(`${e.message} ${e.stack}`);
        res.status(500).end(e);
      }
    }
  })
);

router.post(
  '/requestLocationAccess',
  authenticate,
  awaitHandler(async (req, res) => {
    let pool;
    try {
      pool = await poolPromise;
      const requests = await pool
        .request()
        .query(
          `insert into jAccessReqList (JID, userID) values (${req.body.JID}, ${req.userID})`
        );
      res.send(requests);
    } catch (e) {
      console.log(e);
      slackBot(`${e.message} ${e.stack}`);
      res.status(500).end(e);
    }
  })
);

router.post(
  '/acceptLocationRequest',
  authenticate,
  awaitHandler(async (req, res) => {
    let pool;
    if (req.userID != process.env.ADMINUID) {
      res.status(203).send({ err: 'user unauthorized' });
    } else {
      try {
        pool = await poolPromise;
        const response = await pool
          .request()
          .query(`exec acceptJAccessRequest @inReqID = ${req.body.reqID}`);
        res.send(response);
      } catch (e) {
        console.log(e);
        slackBot(`${e.message} ${e.stack}`);
        res.status(500).end(e);
      }
    }
  })
);

router.delete(
  '/denyLocationRequest',
  authenticate,
  awaitHandler(async (req, res) => {
    let pool;
    if (req.userID != process.env.ADMINUID) {
      res.status(203).send({ err: 'user unauthorized' });
    } else {
      try {
        pool = await poolPromise;
        const response = await pool
          .request()
          .query(`DELETE FROM jAccessReqList WHERE reqID = ${req.body.reqID}`);
        res.send(response);
      } catch (e) {
        console.log(e);
        slackBot(`${e.message} ${e.stack}`);
        res.status(500).end(e);
      }
    }
  })
);

router.post(
  '/removeLocationAccess',
  authenticate,
  awaitHandler(async (req, res) => {
    let pool;
    if (req.userID != process.env.ADMINUID) {
      res.status(203).send({ err: 'user unauthorized' });
    } else {
      try {
        pool = await poolPromise;
        const response = await pool
          .request()
          .query(
            `DELETE from jAccess where JID = ${req.body.JID} and UserId = ${req.body.userID}`
          );
        res.send(response);
      } catch (e) {
        console.log(e);
        slackBot(`${e.message} ${e.stack}`);
        res.status(500).end(e);
      }
    }
  })
);

module.exports = router;
