const express = require("express");
const router = express.Router();
const sql = require("mssql");

const { findDensity, findAvgTime } = require("../helpers/statisticsHelper");
const { db_connect } = require("../middleware/db_connect");
const { authenticate } = require("../middleware/authenticate");

router.post("/getDensity", [db_connect, authenticate], async (req, res) => {
  try {
    let jidds = await req.db.query(
      "select junctionPoint.JID, junctionName from junctionPoint, jAccess where junctionPoint.JID = jAccess.JID and jAccess.UserId = " +
        req.userID
    );
    const jids = jidds.recordset.map(x => x.JID);
    let timeF = req.body.timeF;
    if (timeF == 1) {
      timeF = 15;
    } else if (timeF == 2) {
      timeF = 60;
    } else if (timeF == 3) {
      timeF = 10080;
    } else if (timeF == 4) {
      timeF = 43800;
    }
    let result = [];
    result = await req.db.query(
      `DECLARE @NOWDATE DATETIME;
      set @NOWDATE = DATEADD(HH, +5, GETDATE());
      set @NOWDATE = DATEADD(n, +30, @NOWDATE);
      set @NOWDATE = DATEADD(mi, -${timeF}, @NOWDATE);
      select * from LogDelhi where UID in (${jids.toString()}) 
      and Upload_Time > @NOWDATE`
    );
    let parsedObj = {};
    jids.forEach(e => {
      parsedObj[e] = [];
    });
    let resObj = {};
    console.log(result.recordset.length);
    result.recordset.forEach(e => {
      parsedObj[e.UID].push(e.Message);
    });
    for (let key in parsedObj) {
      if (parsedObj[key] !== undefined && parsedObj[key].length > 0) {
        resObj[key] = findDensity(parsedObj[key]);
      }
    }
    await sql.close();
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
    res.send(formatRes);
  } catch (e) {
    await sql.close();
    console.log(e);
    res.sendStatus(500).end();
  }
});

router.post("/getAvgTime", [db_connect, authenticate], async (req, res) => {
  try {
    let jidds = await req.db.query(
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
    if (timeF == 1) {
      timeF = 15;
    } else if (timeF == 2) {
      timeF = 60;
    } else if (timeF == 3) {
      timeF = 10080;
    } else if (timeF == 4) {
      timeF = 43800;
    }
    let result = [];
    result = await req.db.query(
      `DECLARE @NOWDATE DATETIME;
      set @NOWDATE = DATEADD(HH, +5, GETDATE());
      set @NOWDATE = DATEADD(n, +30, @NOWDATE);
      set @NOWDATE = DATEADD(mi, -${timeF}, @NOWDATE);
      select * from LogDelhi where UID in (${jids.toString()}) 
      and Upload_Time > @NOWDATE`
    );
    result = result.recordset.map(e => {
      return { Upload_Time: e.Upload_Time, Message: e.Message };
    });
    Sendres = findAvgTime(result, req.body.grpBy);
    await sql.close();
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
    res.send(Sendres);
  } catch (e) {
    await sql.close();
    console.log(e);
    if (e == 401) {
      res.sendStatus(401).end();
    } else {
      res.sendStatus(500).end();
    }
  }
});

router.post("/getActSig", [db_connect, authenticate], async (req, res) => {
  try {
    let result = await req.db.query(
      "select junctionPoint.JID, junctionName from junctionPoint, jAccess where junctionPoint.JID = jAccess.JID and jAccess.UserId = " +
        req.userID
    );
    result = result.recordset.map(x => {
      return { JID: x.JID, name: x.junctionName };
    });
    let jids = result.map(x => x.JID);
    console.log(result);
     
    let activeSatusResult = await req.db.query(`
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
    await sql.close();
    res.send({"running":running, "warning":warning, "error":error});
  } catch (e) {
    await sql.close();
    console.log(e);
  }
});

module.exports = router;