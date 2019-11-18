const express = require('express');
const router = express.Router();

const { poolPromise } = require('../db/sql_connect');
const { poolPromise2 } = require('../db/sql_connect2');
const { authenticate } = require('../middleware/authenticate');
const { center_geolocation } = require('../helpers/center_geolocation');
const { timer } = require('../helpers/timerpage');

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

router.post(
  '/newJunctionPoint',
  authenticate,
  awaitHandler(async (req, res) => {
    let pool;
    try {
      pool = await poolPromise;
      let result = await pool
        .request()
        .query(
          "insert into junctionPoint (JID, longitude, latitude, area, city, junctionName) values('" +
            req.body.JID +
            "','" +
            req.body.longitude +
            "','" +
            req.body.latitude +
            "','" +
            req.body.area +
            "','" +
            req.body.city +
            "','" +
            req.body.junctionName +
            "')"
        );
      result = await pool
        .request()
        .query(
          'select JID from junctionPoint where longitude = ' +
            req.body.longitude +
            'and latitude =' +
            req.body.latitude
        );
      const JID = result.recordset[0].JID;
      result = await pool
        .request()
        .query(
          'exec addUserAccess @inUserId = ' + req.userID + ', @InJID = ' + JID
        );
      //change the @inUserId according to the userId of who is admin of the application, because eery juntion point added he can access it
      if (req.userID != 2) {
        result = await pool
          .request()
          .query('exec addUserAccess @inUserId = 2, @InJID = ' + JID);
      }
      result = await pool
        .request()
        .query('select * from junctionPoint where JID = ' + JID);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(result.recordset[0]);
    } catch (e) {
      console.log(e);
      res.status(500).send(e);
    }
  })
);

router.get(
  '/getUserJIDS',
  authenticate,
  awaitHandler(async (req, res) => {
    let pool;
    try {
      pool = await poolPromise;
      let jids = await pool
        .request()
        .query(
          'select junctionPoint.JID, junctionName  from junctionPoint, jAccess where junctionPoint.JID = jAccess.JID and jAccess.UserId = ' +
            req.userID
        );
      jids = jids.recordset.map(x => {
        return { JID: x.JID, name: x.junctionName };
      });
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(jids);
    } catch (e) {
      console.log(e);
      res.sendStatus(500).send(e);
    }
  })
);
router.get(
  '/getAllLocations',
  authenticate,
  awaitHandler(async (req, res) => {
    let pool;
    try {
      pool = await poolPromise;
      let response = await pool.request().query('select * from junctionPoint');
      res.send(response.recordset);
    } catch (e) {
      console.log(e);
      res.status(500).send(e);
    }
  })
);

router.get(
  '/getLocations',
  authenticate,
  awaitHandler(async (req, res) => {
    let pool;
    let pool2;
    try {
      pool = await poolPromise;
      pool2 = await poolPromise2;
      let result = await pool
        .request()
        .query('exec getLocationsForUser @inUserId = ' + req.userID);
      const centerPoints = center_geolocation(result.recordset);
      let jids = [];
      result.recordset.forEach(e => {
        jids.push(e.JID[0]);
      });
      let activeSatusResult = await pool2.request().query(`
    WITH cte 
     AS (SELECT UID, 
                Error_Code,
                Row_number() 
                  OVER ( 
                    partition BY UID 
                    ORDER BY UPLOAD_TIME DESC) rn 
         FROM   TrafficInfoPage where UID in (${jids.toString()})) 
    SELECT UID, ERROR_CODE
    FROM   cte 
    WHERE  rn = 1
    ORDER BY UID
    `);
      result.recordset.forEach(e => {
        e.JID = e.JID[0];
        temp = activeSatusResult.recordset.find(h => {
          return h.UID === e.JID;
        });
        if (temp != undefined) {
          e['activeStatus'] = temp.ERROR_CODE;
        } else {
          e['activeStatus'] = 2;
        }
      });
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send({ centerPoints, doc: result.recordset });
    } catch (e) {
      console.log(e);
      res.status(500).send(e);
    }
  })
);

router.post(
  '/giveLocationAccess',
  authenticate,
  awaitHandler(async (req, res) => {
    let pool;
    if (req.userID === 2) {
      try {
        pool = await poolPromise;
        let result = await pool
          .request()
          .query(
            'exec addUserAccess @inUserId = ' +
              req.body.addUserid +
              ', @InJID = ' +
              req.body.JID
          );
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.send(result);
      } catch (e) {
        console.log(e);
        res.status(500).send(e);
      }
    } else {
      res
        .status(203)
        .send({ err: 'person unauthorized to perform this action' });
    }
  })
);

router.post(
  '/timerpage',
  authenticate,
  awaitHandler(async (req, res) => {
    let pool;
    let pool2;
    try {
      pool = await poolPromise;
      pool2 = await poolPromise2;
      let jidds = await pool
        .request()
        .query(
          'select junctionPoint.JID from junctionPoint, jAccess where junctionPoint.JID = jAccess.JID and jAccess.UserId = ' +
            req.userID
        );
      jidds = jidds.recordset.map(x => x.JID);
      const jids = req.body.interID;
      if (
        jidds.find(e => {
          return e == jids;
        }) === undefined
      ) {
        throw '203';
      }
      let result = await pool2
        .request()
        .query(
          `Select TOP 3 Upload_Time, Message from TrafficInfoPage where UID = ${jids.toString()} order by Upload_Time DESC`
        );
      let packets = result.recordset.map(x => x.Message);
      let date_time = result.recordset.map(x => x.Upload_Time);
      if (packets.length < 3) {
        throw 'less than 3 packets';
      }
      let x = timer(packets, date_time);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(x);
    } catch (e) {
      console.log(e);
      if (e == 203) {
        res.status(203).send({ err: 'unauthorized Junction ID' });
      } else if (e === 'less than 3 packets') {
        res
          .status(503)
          .send({ err: 'less than three packets in trafficinfopage table' });
      } else {
        res.sendStatus(500).end();
      }
    }
  })
);

module.exports = router;
