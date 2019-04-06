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
    let result = [];
    result = await req.db.query(
      `select * from LogDelhi where UID in (${jids.toString()}) 
      and Upload_Time > '2019-04-05'`
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

    let result = [];
    result = await req.db.query(
      `select * from LogDelhi where UID in (${jids.toString()}) 
      and Upload_Time > '2019-04-05'`
    );
    result = result.recordset.map(e => {
      return { Upload_Time: e.Upload_Time, Message: e.Message };
    });
    Sendres = findAvgTime(result, req.body.grpBy);
    await sql.close();
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
