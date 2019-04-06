const express = require("express");
const router = express.Router();
const sql = require("mssql");

const { db_connect } = require("../middleware/db_connect");
const { authenticate } = require("../middleware/authenticate");
const { center_geolocation } = require("../helpers/center_geolocation");

router.post("/newJunctionPoint", [db_connect, authenticate], async (req, res) => {
    try {
        req.on("close", async err => {
            await sql.close();
        });
        let result = await req.db.query(
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
        result = await req.db.query(
            "select JID from junctionPoint where longitude = " +
            req.body.longitude +
            "and latitude =" +
            req.body.latitude
        );
        const JID = result.recordset[0].JID;
        result = await req.db.query(
            "exec addUserAccess @inUserId = " + req.userID + ", @InJID = " + JID
        );
        // console.log(result);
        result = await req.db.query(
            "exec addUserAccess @inUserId = 1, @InJID = " + JID
        );
        result = await req.db.query(
            "select * from junctionPoint where JID = " + JID
        );
        await sql.close();
        res.send(result.recordset[0]);
    } catch (e) {
        await sql.close();
        res.status(401).send(e);
    }
});

router.get("/getLocations", [db_connect, authenticate], async (req, res) => {
  try {
    req.on("close", async err => {
      await sql.close();
    });
    let result = await req.db.query(
      "exec getLocationsForUser @inUserId = " + req.userID
    );  
    const centerPoints = center_geolocation(result.recordset);
    let jids = [];
    result.recordset.forEach(e => {
      jids.push(e.JID[0]);
    });
    // console.log(jids);
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
    await sql.close();
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
    await sql.close();
    console.log(e);
    res.status(500).send(e);
  }
});

router.post(
  "/giveLocationAccess",
  [db_connect, authenticate],
  async (req, res) => {
    if (req.userID === 1) {
      try {
        req.on("close", async err => {
          await sql.close();
        });
        let result = await req.db.query(
          "exec addUserAccess @inUserId = " +
            req.body.addUserid +
            ", @InJID = " +
            req.body.JID
        );
        await sql.close();
        res.send(result);
      } catch (e) {
        await sql.close();
        res.status(500).send(e);
      }
    }
  }
);

module.exports = router;