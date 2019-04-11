const express = require("express");
const router = express.Router();

const { connection } = require("../db/sql_connect");
const { authenticate } = require("../middleware/authenticate");
const { center_geolocation } = require("../helpers/center_geolocation");
const {timer } = require('../helpers/timerpage');
router.post("/newJunctionPoint",  authenticate, async (req, res) => {
  let pool;
    try {
        req.on("close", async err => {
            await pool.close();
        });
        pool = await connection.connect();
        let result = await pool.request().query(
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
        result = await pool.request().query(
            "select JID from junctionPoint where longitude = " +
            req.body.longitude +
            "and latitude =" +
            req.body.latitude
        );
        const JID = result.recordset[0].JID;
        result = await pool.request().query(
            "exec addUserAccess @inUserId = " + req.userID + ", @InJID = " + JID
        );
        // console.log(result);
        result = await pool.request().query(
            "exec addUserAccess @inUserId = 1, @InJID = " + JID
        );
        result = await pool.request().query(
            "select * from junctionPoint where JID = " + JID
        );
        await pool.close();
        res.send(result.recordset[0]);
    } catch (e) {
        console.log(e);
        await pool.close();
        res.status(401).send(e);
    }
});

router.get("/getUserJIDS", authenticate, async(req,res)=>{
  let pool;
  try {
    pool = await connection.connect();
    let jids = await pool.request().query(
      "select junctionPoint.JID, junctionName  from junctionPoint, jAccess where junctionPoint.JID = jAccess.JID and jAccess.UserId = " +
        req.userID
    );
    jids = jids.recordset.map(x => { return {JID: x.JID, name: x.junctionName}});
    pool.close();
    res.send(jids);
  } catch (e) {
    console.log(e);
    await pool.close();
    res.sendStatus(500).send(e);
  }
})

router.get("/getLocations", authenticate, async (req, res) => {
  let pool;
  try {
    pool = await connection.connect();
    req.on("close", async err => {
      await pool.close();
    });
    let result = await pool
      .request()
      .query("exec getLocationsForUser @inUserId = " + req.userID);  
    const centerPoints = center_geolocation(result.recordset);
    let jids = [];
    result.recordset.forEach(e => {
      jids.push(e.JID[0]);
    });
    // console.log(jids);
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
    await pool.close();
    result.recordset.forEach(e => {
      e.JID = e.JID[0];
      temp = activeSatusResult.recordset.find(h => {
        return h.UID === e.JID;
      });
      // console.log(temp);
      if (temp != undefined) {
        e["activeStatus"] = temp.ERROR_CODE;
      } else {
        e["activeStatus"] = 2;
      }
    });
    // console.log(activeSatusResult.recordset);
    res.send({ centerPoints, doc: result.recordset });
  } catch (e) {
    console.log(e);
    await pool.close();
    res.status(500).send(e);
  }
});

router.post(
  "/giveLocationAccess",
  authenticate,
  async (req, res) => {
    let pool;
    if (req.userID === 1) {
      try {
        pool = await connection.connect();
        req.on("close", async err => {
          await pool.close();
        });
        let result = await pool
          .request()
          .query(
            "exec addUserAccess @inUserId = " +
              req.body.addUserid +
              ", @InJID = " +
              req.body.JID
          );
        await pool.close();
        res.send(result);
      } catch (e) {
        console.log(e);
        await pool.close();
        res.status(500).send(e);
      }
    }
  }
);

router.get('/test/timerpage', async (req, res)=>{
  let pool;
  try{
    pool = await connection.connect();
    let result = await pool
      .request()
      .query(
        "Select TOP 3 Upload_Time, Message from TrafficInfoPage where UID = 23 order by Upload_Time DESC"
      );
    let packets = result.recordset.map(x => x.Message);
    let date_time = result.recordset.map(x => x.Upload_Time);
    let x = timer(packets, date_time);
    console.log(x);
    await pool.close();
    res.send(x);
  }catch(e){
    console.log(e);
    await pool.close();
    res.sendStatus(500).end();
  }
})

module.exports = router;