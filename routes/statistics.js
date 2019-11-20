/* eslint-disable no-throw-literal */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const express = require('express');

const router = express.Router();

const NodeCache = require('node-cache');

const { findDensity, findAvgTime } = require('../helpers/statisticsHelper');
const { authenticate } = require('../middleware/authenticate');
const { poolPromise } = require('../db/sql_connect');
const { poolPromise2 } = require('../db/sql_connect2');

const myCache = new NodeCache();

const getTimeInMinutes = timeF => {
  // past 15 mins
  if (timeF == 1) {
    return 15;
  } else if (timeF == 2) {
    // past hour
    return 60;
  } else if (timeF == 3) {
    // today
    return "concat(format(@NOWDATE, 'yyyy-MM-dd'), ' 00:00:00.000')";
  } else if (timeF == 4) {
    // this week
    return "concat(format(@NOWDATE, 'yyyy-MM'), '-', format(DATEADD(dd, -(DATEPART(dw, @NOWDATE)-1), @NOWDATE), 'dd'), ' 00:00:00.000')";
  } else if (timeF == 5) {
    // this month
    return "concat(format(@NOWDATE, 'yyyy-MM'), '-01 00:00:00.000')";
  }
  return '';
};

const awaitHandler = fn => {
  return async (req, res, next) => {
    try {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      await fn(req, res, next);
    } catch (err) {
      console.log(err);
      next(err);
    }
  };
};

router.post(
  '/getDensity',
  authenticate,
  awaitHandler(async (req, res) => {
    const mCacheKey = `getDensity${req.body.timeF}`;
    const mCacheValue = myCache.get(mCacheKey);
    if (mCacheValue) {
      res.send(JSON.parse(mCacheValue));
    } else {
      let pool;
      try {
        console.log('Get density endpoint');
        pool = await poolPromise;
        const jidds = await pool
          .request()
          .query(
            `select junctionPoint.JID, junctionName from junctionPoint, jAccess where junctionPoint.JID = jAccess.JID and jAccess.UserId = ${req.userID}`
          );
        const jids = jidds.recordset.map(x => x.JID);
        const { timeF } = req.body;
        const timeCondition = getTimeInMinutes(timeF);
        let result = [];
        if (timeF == 3 || timeF == 4 || timeF == 5) {
          result = await pool.request().query(
            // set @NOWDATE = DATEADD(HH, +5, GETDATE());
            `DECLARE @NOWDATE DATETIME;
        set @NOWDATE = DATEADD(HH, +5, CONVERT(datetime, '06-09-2019  6:00:00 PM'));
        set @NOWDATE = DATEADD(n, +30, @NOWDATE);
        select * from LogDelhi where UID in (${jids.toString()}) 
        and Upload_Time > ${timeCondition}`
          );
        } else {
          // set @NOWDATE = DATEADD(HH, +5, GETDATE());
          result = await pool.request().query(
            `DECLARE @NOWDATE DATETIME;
        set @NOWDATE = DATEADD(HH, +5, CONVERT(datetime, '06-09-2019  6:00:00 PM'));
        set @NOWDATE = DATEADD(n, +30, @NOWDATE);
        set @NOWDATE = DATEADD(mi, -${timeCondition}, @NOWDATE);
        select * from LogDelhi where UID in (${jids.toString()}) 
        and Upload_Time > @NOWDATE`
          );
        }
        const parsedObj = {};
        jids.forEach(e => {
          parsedObj[e] = [];
        });
        const resObj = {};
        result.recordset.forEach(e => {
          parsedObj[e.UID].push(e.Message);
        });
        for (const key in parsedObj) {
          if (parsedObj[key] !== undefined && parsedObj[key].length > 0) {
            resObj[key] = findDensity(parsedObj[key]);
          }
        }
        const formatRes = [];
        for (const key in resObj) {
          const temp = {};
          // temp["JID"] = key;
          temp.intersectionName = jidds.recordset.find(e => {
            return e.JID == key;
          }).junctionName;
          temp.avgDensity = resObj[key];
          formatRes.push(temp);
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        myCache.set(mCacheKey, JSON.stringify(formatRes), 300);
        res.send(formatRes);
      } catch (e) {
        console.log(e);
        res.sendStatus(500).end();
      }
    }
  })
);

router.post(
  '/getAvgTime',
  authenticate,
  awaitHandler(async (req, res) => {
    const mCacheKey = `getDensity${req.body.timeF}${req.body.interID}${req.body.grpBy}`;
    const mCacheValue = myCache.get(mCacheKey);
    if (mCacheValue) {
      res.send(JSON.parse(mCacheValue));
    } else {
      let pool;
      try {
        pool = await poolPromise;
        let jidds = await pool
          .request()
          .query(
            `select junctionPoint.JID from junctionPoint, jAccess where junctionPoint.JID = jAccess.JID and jAccess.UserId = ${req.userID}`
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
        // timeF - timeframe information is in getTimeInMinutes function
        const { timeF } = req.body;
        const timeCondition = getTimeInMinutes(timeF);
        let result = [];
        if (timeF == 3 || timeF == 4 || timeF == 5) {
          // set @NOWDATE = DATEADD(HH, +5, GETDATE());
          result = await pool.request().query(
            `DECLARE @NOWDATE DATETIME;
        set @NOWDATE = DATEADD(HH, +5, CONVERT(datetime, '06-09-2019  6:00:00 PM'));
        set @NOWDATE = DATEADD(n, +30, @NOWDATE);
        select * from LogDelhi where UID in (${jids.toString()}) 
        and Upload_Time > ${timeCondition}`
          );
        } else {
          // set @NOWDATE = DATEADD(HH, +5, GETDATE());
          result = await pool.request().query(
            `DECLARE @NOWDATE DATETIME;
        set @NOWDATE = DATEADD(HH, +5, CONVERT(datetime, '06-09-2019  6:00:00 PM'));
        set @NOWDATE = DATEADD(n, +30, @NOWDATE);
        set @NOWDATE = DATEADD(mi, -${timeCondition}, @NOWDATE);
        select * from LogDelhi where UID in (${jids.toString()}) 
        and Upload_Time > @NOWDATE`
          );
        }
        result = result.recordset.map(e => {
          return { Upload_Time: e.Upload_Time, Message: e.Message };
        });
        // grpBy use in statisticdHelper page
        let Sendres = findAvgTime(result, req.body.grpBy);
        Sendres = Sendres.map(e => {
          const temp = e.find(x => {
            return x != null;
          });
          if (temp) {
            return e;
          } else {
            return [];
          }
        });
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        myCache.set(mCacheKey, JSON.stringify(Sendres), 300);
        res.send(Sendres);
      } catch (e) {
        console.log(e);
        if (e == 203) {
          res.sendStatus(203).send({ err: 'unauthorized Junction ID' });
        } else {
          res.sendStatus(500).end();
        }
      }
    }
  })
);

router.post(
  '/getActSig',
  authenticate,
  awaitHandler(async (req, res) => {
    let pool;
    let pool2;
    try {
      pool = await poolPromise;
      pool2 = await poolPromise2;
      let result = await pool
        .request()
        .query(
          `select junctionPoint.JID, junctionName from junctionPoint, jAccess where junctionPoint.JID = jAccess.JID and jAccess.UserId = ${req.userID}`
        );
      result = result.recordset.map(x => {
        return { JID: x.JID, name: x.junctionName };
      });
      const jids = result.map(x => x.JID);

      const activeSatusResult = await pool2.request().query(`
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
      const running = [];
      const warning = [];
      const error = [];
      result.forEach(e => {
        const temp = activeSatusResult.recordset.find(x => {
          return x.UID === e.JID;
        });
        if (temp != undefined) {
          if (temp.ERROR_CODE == 0) {
            running.push(e.name);
          } else if (temp.ERROR_CODE == 1) {
            warning.push(e.name);
          } else {
            error.push(e.name);
          }
        } else {
          error.push(e.name);
        }
      });
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send({ running, warning, error });
    } catch (e) {
      console.log(e);
      res.sendStatus(500).end();
    }
  })
);

module.exports = router;
