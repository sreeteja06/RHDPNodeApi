const express = require("express");
const router = express.Router();

const { findDensity, findAvgTime } = require("../helpers/statisticsHelper");
const { authenticate } = require("../middleware/authenticate");
const { connection } = require("../db/sql_connect");

const getTimeInMinutes = timeF => {
  if (timeF == 1) {
    return 15;
  } else if (timeF == 2) {
    return 60;
  } else if (timeF == 3) {
    return "concat(format(@NOWDATE, 'yyyy-MM-dd'), ' 00:00:00.000')";
  }else if (timeF == 4) {
    return "concat(format(@NOWDATE, 'yyyy-MM'), '-', format(DATEADD(dd, -(DATEPART(dw, @NOWDATE)-1), @NOWDATE), 'dd'), ' 00:00:00.000')";
  } else if (timeF == 5) {
    return "concat(format(@NOWDATE, 'yyyy-MM'), '-01 00:00:00.000')";
  }
}

router.post("/getDensity",  authenticate, async (req, res) => {
  let pool;
  try {
    pool = await connection.connect();
    let jidds = await pool.request().query(
      "select junctionPoint.JID, junctionName from junctionPoint, jAccess where junctionPoint.JID = jAccess.JID and jAccess.UserId = " +
        req.userID
    );
    const jids = jidds.recordset.map(x => x.JID);
    let timeF = req.body.timeF;
    let timeCondition = getTimeInMinutes(timeF);
    let result = [];
    if (timeF == 3 || timeF == 4 || timeF == 5) {
      result = await pool.request().query(
        `DECLARE @NOWDATE DATETIME;
        set @NOWDATE = DATEADD(HH, +5, GETDATE());
        set @NOWDATE = DATEADD(n, +30, @NOWDATE);
        select * from LogDelhi where UID in (${jids.toString()}) 
        and Upload_Time > ${timeCondition}`
      );
    } else {
      result = await pool.request().query(
        `DECLARE @NOWDATE DATETIME;
        set @NOWDATE = DATEADD(HH, +5, GETDATE());
        set @NOWDATE = DATEADD(n, +30, @NOWDATE);
        set @NOWDATE = DATEADD(mi, -${timeCondition}, @NOWDATE);
        select * from LogDelhi where UID in (${jids.toString()}) 
        and Upload_Time > @NOWDATE`
      );
    }
    let parsedObj = {};
    jids.forEach(e => {
      parsedObj[e] = [];
    });
    let resObj = {};
    result.recordset.forEach(e => {
      parsedObj[e.UID].push(e.Message);
    });
    for (let key in parsedObj) {
      if (parsedObj[key] !== undefined && parsedObj[key].length > 0) {
        resObj[key] = findDensity(parsedObj[key]);
      }
    }
    await pool.close();
    let formatRes = [];
    for (let key in resObj) {
      let temp = {};
      // temp["JID"] = key;
      temp["intersectionName"] = jidds.recordset.find(e => {
        return e.JID == key;
      })["junctionName"];
      temp["avgDensity"] = resObj[key];
      formatRes.push(temp);
    }
    res.setHeader( 'Content-Type', 'application/json; charset=utf-8' );
    res.send(formatRes);
  } catch (e) {
    console.log(e);
    await pool.close();
    res.sendStatus(500).end();
  }
});

router.post("/getAvgTime", authenticate, async (req, res) => {
  let pool;
  try {
    pool = await connection.connect();
    let jidds = await pool
      .request()
      .query(
        "select junctionPoint.JID from junctionPoint, jAccess where junctionPoint.JID = jAccess.JID and jAccess.UserId = " +
          req.userID
      );
    jidds = jidds.recordset.map(x => x.JID);
    const jids = req.body.interID;
    if (
      jidds.find(e => {
        return e == jids;
      }) === undefined
    ) {
      throw "401";
    }

    let timeF = req.body.timeF;
    let timeCondition = getTimeInMinutes(timeF);
    let result = [];
    if(timeF == 3 || timeF == 4 || timeF == 5){
      result = await pool.request().query(
        `DECLARE @NOWDATE DATETIME;
        set @NOWDATE = DATEADD(HH, +5, GETDATE());
        set @NOWDATE = DATEADD(n, +30, @NOWDATE);
        select * from LogDelhi where UID in (${jids.toString()}) 
        and Upload_Time > ${timeCondition}`
      );
    }
    else{
      result = await pool.request().query(
        `DECLARE @NOWDATE DATETIME;
        set @NOWDATE = DATEADD(HH, +5, GETDATE());
        set @NOWDATE = DATEADD(n, +30, @NOWDATE);
        set @NOWDATE = DATEADD(mi, -${timeCondition}, @NOWDATE);
        select * from LogDelhi where UID in (${jids.toString()}) 
        and Upload_Time > @NOWDATE`
      );
    }
    result = result.recordset.map(e => {
      return { Upload_Time: e.Upload_Time, Message: e.Message };
    });
    Sendres = findAvgTime(result, req.body.grpBy);
    await pool.close();
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
    res.setHeader( 'Content-Type', 'application/json; charset=utf-8' );
    res.send(Sendres);
  } catch (e) {
    console.log(e);
    await pool.close();
    if (e == 401) {
      res.sendStatus(401).end();
    } else {
      res.sendStatus(500).end();
    }
  }
});

router.post("/getActSig", authenticate, async (req, res) => {
  let pool;
  try {
    pool = await connection.connect();
    let result = await pool
      .request()
      .query(
        "select junctionPoint.JID, junctionName from junctionPoint, jAccess where junctionPoint.JID = jAccess.JID and jAccess.UserId = " +
          req.userID
      );
    result = result.recordset.map(x => {
      return { JID: x.JID, name: x.junctionName };
    });
    let jids = result.map(x => x.JID);
     
    let activeSatusResult = await pool.request().query(`
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
    let running = [];
    let warning = [];
    let error = [];
    result.forEach(e => {
      let temp = activeSatusResult.recordset.find(x => {
        return x.UID === e.JID;
      });
      if(temp != undefined){
        if (temp.ERROR_CODE == 0) {
          running.push(e.name);
        } else if (temp.ERROR_CODE == 1) {
          warning.push(e.name);
        } else {
          error.push(e.name);
        }
      }else{
        error.push(e.name);
      }
    });
    await pool.close();
    res.setHeader( 'Content-Type', 'application/json; charset=utf-8' );
    res.send({"running":running, "warning":warning, "error":error});
  } catch (e) {
    console.log(e);
    await pool.close();
    res.sendStatus(500).end();
  }
});

module.exports = router;