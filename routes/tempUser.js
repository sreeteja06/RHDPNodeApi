/*
 * SPDX-License-Identifier: Apache-2.0
 *         _____________  ___  
 *        / ___/ ___/ _ \/ _ \ 
 *      (__  ) /  /  __/  __/ 
 *     /____/_/   \___/\___  
 * File Created: Monday, 18th November 2019 2:58:28 pm
 * Author: SreeTeja06 (sreeteja.muthyala@gmail.com)

 */
const express = require('express');

const router = express.Router();
const bcrypt = require('bcryptjs');

const { poolPromise } = require('../db/sql_connect');
const { authenticate } = require('../middleware/authenticate');
const mailer = require('../helpers/mail');
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

router.post(
  '/sendJoinRequest',
  awaitHandler(async (req, res) => {
    let password;
    const pool = await poolPromise;
    const testResponse = await pool
      .request()
      .query(`select * from tempUser where email = '${req.body.email}'`);
    const usersResponse = await pool
      .request()
      .query(`select * from users where email = '${req.body.email}'`);
    if (testResponse.recordset.length > 0) {
      res.status(409).send({
        err: 'already tempUser Registered'
      });
    } else if (usersResponse.recordset.length > 0) {
      res.status(409).send({
        err: 'already user Registered'
      });
    } else {
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          console.log(err);
          slackBot(`${err.message} ${err.stack}`);
          res.send(500).send(err);
        }
        // eslint-disable-next-line no-shadow
        bcrypt.hash(req.body.password, salt, async (err, hash) => {
          if (err) {
            console.log(err);
            slackBot(`${err.message} ${err.stack}`);
            res.send(500).send(err);
          }
          password = hash;
          try {
            const OTP = Math.floor(Math.random() * 100000);
            console.log(`OTP for ${req.body.email} is ${OTP}`);
            let result = await pool
              .request()
              .query(
                `insert into tempUser (email, password, name, phone, OTP) values('${req.body.email}','${password}', '${req.body.name}',${req.body.phone}, ${OTP})`
              );
            result = await pool
              .request()
              .query(
                `select tempUserID from tempUser where email = '${req.body.email}'`
              );
            const { tempUserID } = result.recordset[0];
            mailer(
              'OTP for Cyberabad Traffic Analytics suite',
              `OTP generation: ${OTP} is your otp for registering on Cyberabad Traffic Analytics suite.`,
              req.body.email
            );
            mailer(
              'New Join Request for Cyberabad Traffic Analytics suite',
              `There is a new request to access Cyberabad Traffic Analytics suite.
              The details are email: ${req.body.email} \n ${req.body.name}`,
              'raghav_dave93@outlook.com'
            );
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.send({
              tempUserID,
              email: req.body.email
            });
            // eslint-disable-next-line no-shadow
          } catch (err) {
            console.log(err);
            slackBot(`${err.message} ${err.stack}`);
            res.status(500).send(err);
          }
        });
      });
    }
  })
);

router.post(
  '/reSendOTP',
  awaitHandler(async (req, res) => {
    const pool = await poolPromise;
    const testResponse = await pool
      .request()
      .query(`select * from tempUser where email = '${req.body.email}'`);
    if (testResponse.recordset.length <= 0) {
      res.status(409).send({
        err: 'No such user registered'
      });
    } else {
      const OTP = Math.floor(Math.random() * 100000);
      const result = await pool
        .request()
        .query(
          `update tempUser set OTP = ${OTP} where email = '${req.body.email}'`
        );
      mailer(
        'OTP for Cyberabad Traffic Analytics suite',
        `OTP generation: ${OTP} is your otp for registering on Cyberabad Traffic Analytics suite.`,
        req.body.email
      );
      res.send(result);
    }
  })
);

router.post(
  '/verifyTempUser',
  awaitHandler(async (req, res) => {
    const pool = await poolPromise;
    const testResponse = await pool
      .request()
      .query(`select * from tempUser where email = '${req.body.email}'`);
    if (testResponse.recordset.length <= 0) {
      res.status(409).send({ err: 'no such temp user' });
    } else if (testResponse.recordset[0].OTP == req.body.OTP) {
      const response = await pool
        .request()
        .query(
          `update tempUser set verified = 1 where email = '${req.body.email}'`
        );
      mailer(
        'Registration confirmed for Cyberabad Traffic Analytics suite',
        'Successful OTP: Thanks for registering. We ‘ll notify you soon when the admin grants or declines your access request',
        testResponse.recordset[0].email
      );
      res.send(response);
    } else {
      res.status(401).send({ err: 'Wrong OTP' });
    }
  })
);

router.get(
  '/getJoinRequests',
  authenticate,
  awaitHandler(async (req, res) => {
    if (req.userID == process.env.ADMINUID) {
      const pool = await poolPromise;
      const response = await pool
        .request()
        .query(
          'select tempUserID, email, name, phone from tempUser where verified = 1'
        );
      console.log(response.recordset);
      res.send(response.recordset);
    } else {
      res.status(203).send({ err: 'user unauthorized' });
    }
  })
);

router.post(
  '/acceptJoinRequest',
  authenticate,
  awaitHandler(async (req, res) => {
    if (req.userID == process.env.ADMINUID) {
      const pool = await poolPromise;
      const testResponse = await pool
        .request()
        .query(
          `select * from tempUser where tempUserID = ${req.body.tempUserID}`
        );
      if (testResponse.recordset.length <= 0) {
        res.status(409).send({ err: 'no such temp user' });
      } else {
        const response = await pool
          .request()
          .query(
            `exec acceptUserRequest @inTempUserID = ${req.body.tempUserID}`
          );
        res.send(response);
        mailer(
          'Request accepted for Cyberabad Traffic Analytics suite',
          'Congratulations! You now have access to the Cyberabad Traffic Analytics suite.',
          testResponse.recordset[0].email
        );
      }
    } else {
      res.status(203).send({ err: 'user unauthorized' });
    }
  })
);

router.post(
  '/denyJoinRequest',
  authenticate,
  awaitHandler(async (req, res) => {
    if (req.userID == process.env.ADMINUID) {
      const pool = await poolPromise;
      const testResponse = await pool
        .request()
        .query(
          `select * from tempUser where tempUserID = ${req.body.tempUserID}`
        );
      if (testResponse.recordset.length <= 0) {
        res.status(409).send({ err: 'no such temp user' });
      } else {
        const response = await pool
          .request()
          .query(
            `delete from tempUser where tempUserID = ${req.body.tempUserID}`
          );
        mailer(
          'Request declined for Cyberabad Traffic Analytics suite',
          'Apologies! Your request for access to Cyberabad Traffic Analytics suite has been denied by admin.',
          testResponse.recordset[0].email
        );
        res.send(response);
      }
    } else {
      res.status(203).send({ err: 'user unauthorized' });
    }
  })
);

module.exports = router;
