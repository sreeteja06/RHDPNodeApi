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

router.get("/getDensity", [db_connect], async (req, res) => {
  try {
    let jidds = await req.db.query(
      "select junctionPoint.JID, junctionName from junctionPoint, jAccess where junctionPoint.JID = jAccess.JID and jAccess.UserId = 1"
    );
    const jids = jidds.recordset.map(x => x.JID);
    console.log(jids);
    let result = []
    result = await req.db.query(
      `select * from LogDelhi where UID in (${jids.toString()}) 
      and Upload_Time > '2019-04-05'`
    );
    let parsedObj = {};
    jids.forEach(e=>{
      parsedObj[e] = [];
    })
    let resObj = {};
    console.log(result.recordset.length);
    result.recordset.forEach(e => {
      parsedObj[e.UID].push(e.Message);
    });
    for(let key in parsedObj){
      if (parsedObj[key] !== undefined && parsedObj[key].length > 0){
        resObj[key] = findDensity(parsedObj[key]);
      }
    }
    await sql.close();
    let formatRes = [];
    for(let key in resObj){
      let temp = {};
      // temp["JID"] = key;
      temp["intersectionName"] = (jidds.recordset.find(e => { return e.JID == key }))["junctionName"];
      temp["avgDensity"] = resObj[key];
      formatRes.push(temp);
    }
    res.send( formatRes );
  } catch (e) {
    await sql.close();
    console.log(e);
    res.sendStatus(500).end();
  }
});

router.get("/getAvgTime", [db_connect], async(req, res) => {
  try {
    // let jids = await req.db.query("select * from junctionPoint, jAccess where junctionPoint.JID = jAccess.JID and jAccess.UserId = @inUserId");
    const jids = [23, 21];
    let result = []
    result = await req.db.query(
      `select * from LogDelhi where UID in (${jids.toString()}) 
      and Upload_Time > '2019-04-05'`
    );
    let parsedObj = {};
    jids.forEach(e => {
      parsedObj[e] = [];
    })
    let resObj = {};
    console.log(result.recordset.length);
    result.recordset.forEach(e => {
      parsedObj[e.UID].push(e.Message);
    });
    for (let key in parsedObj) {
      if (parsedObj[key] !== undefined && parsedObj[key].length > 0) {
        resObj[key] = findAvgTime(parsedObj[key]);
      }
    }
    await sql.close();
    res.send(resObj);
  } catch (e) {
    await sql.close();
    console.log(e);
    res.sendStatus(500).end();
  }
});

module.exports = router;
