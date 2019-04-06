const express = require("express");
const router = express.Router();
const sql = require("mssql");

const { findDensity, findAvgTime } = require("../helpers/statisticsHelper");
const { db_connect } = require("../middleware/db_connect");
const { authenticate } = require("../middleware/authenticate");

const packets = [
  "111001000000000100001111000000111000100000000100000111010001010100110001001001010000111100000000000000000000000001110110",
  "111001000000000100001111000000111000100000000100000111010001010100110001001001010000111100000000000000000000000001110111"
];

router.get("/getDensity", [db_connect, authenticate], async (req, res) => {
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

router.get("/getAvgTime", [db_connect, authenticate], async (req, res) => {
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
    let result = []
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
    Sendres = Sendres.map( e => {
      const temp = e.find(x => {
        return x != null;
      })
      if(temp){
        return e;
      }
      else{
        return [];
      }
    })
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

module.exports = router;
