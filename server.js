require("./config/config");

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sql = require("mssql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { db_connect } = require("./middleware/db_connect");
const { authenticate } = require("./middleware/authenticate");
const { center_geolocation } = require("./helpers/center_geolocation");

let app = express();
app.use(cors());
app.use(bodyParser.json());
const port = process.env.PORT;

const generateAuthToken = (userID, access) => {
  const token = jwt
    .sign({ userID: userID, access }, process.env.JWT_SECRET)
    .toString();
  return token;
};

app.get("/", (req, res) => {
  res.send(`available routes<br/>
	/newJunctionPoint - auth required<br/>
	/getLocations - auth required<br/>
	/giveLocationAccess - auth required - only the admin<br/>
	/user/login - auth required<br/>
	/user/signUp - to create a new user<br/>
	/user/me/logout - auth required<br/>
	/removeJunctionPoint - auth required - only the admin<br/>
	/removeJunctionPointAccess - auth required - only the admin<br/>
	/user/me/updateName - auth required <br/>
	/user/me/updateNumber - auth required <br/>
	/user/me/changePassword - auth required <br/>
	`);
});

app.post("/user/signUp", db_connect, (req, res) => {
  let password;
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      res.send(500).send(err);
    }
    bcrypt.hash(req.body.password, salt, async (err, hash) => {
      if (err) {
        res.send(500).send(err);
      }
      password = hash;
      try {
        let result = await req.db.query(
          "insert into users (email, password, name, phone) values('" +
            req.body.email +
            "','" +
            password +
            "', '" +
            req.body.name +
            "'," +
            req.body.phone +
            ")"
        );
        result = await req.db.query(
          "select userID from users where email = '" + req.body.email + "'"
        );
        const userID = result.recordset[0].userID;
        const token = generateAuthToken(userID, "auth");
        result = await req.db.query(
          "insert into tokens (userID, token, access) values(" +
            userID +
            ",'" +
            token +
            "','" +
            "auth" +
            "')"
        );
        await sql.close();
        res
          .header("x-auth", token)
          .send({ userID: userID, email: req.body.email });
      } catch (err) {
        res.send(err);
      }
    });
  });
});

app.post("/user/login", db_connect, async (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  try {
    let result = await req.db.query(
      "select userID, password from users where email = '" + email + "'"
    );
    bcrypt.compare(
      password,
      result.recordset[0].password,
      async (err, resp) => {
        try {
          if (resp) {
            const userID = result.recordset[0].userID;
            const token = generateAuthToken(userID, "auth");
            result = await req.db.query(
              "insert into tokens (userID, token, access) values(" +
                userID +
                ",'" +
                token +
                "','" +
                "auth" +
                "')"
            );
            console.log(result);
            await sql.close();
            res.append("Access-Control-Allow-Headers", "x-auth, Content-Type");
            res.append("Access-Control-Expose-Headers", "x-auth, Content-Type");
            res
              .header("x-auth", token)
              .send({ user: { userID: userID, email } });
          }
          else{
            await sql.close();
            res.send(401);
          }
        } catch (e) {
          await sql.close();
          console.log(e);
          res.send(500);
        }
      }
    );
  } catch (err) {
    await sql.close();
    res.send(500);
  }
});

app.delete("/user/me/logout", [db_connect, authenticate],async (req, res)=>{
  try{
    const result = await req.db.query("exec removeToken @inToken = '"+ req.token +"'");
    await sql.close();
    res.send(result);
  }catch(e){
    await sql.close();
    res.status(500).send(e);
  }
});

app.get("/user/me", [db_connect, authenticate], (req, res)=> {
  res.send({userID: req.userID});
});

app.post("/newJunctionPoint", [db_connect, authenticate], async (req, res)=> {
  try{
    let result = await req.db.query(
      "insert into junctionPoint (longitude, latitude, area, city, junctionName) values('" + req.body.longitude + "','" + req.body.latitude + "','" + req.body.area + "','" + req.body.city + "','" + req.body.junctionName +"')"
    );
    result = await req.db.query("select JID from junctionPoint where longitude = "+ req.body.longitude + "and latitude =" + req.body.latitude);
    const JID = result.recordset[0].JID;
    result = await req.db.query("exec addUserAccess @inUserId = " + req.userID +", @InJID = "+ JID);
    console.log(result);
    result = await req.db.query("exec addUserAccess @inUserId = 1, @InJID = "+ JID);
    result = await req.db.query("select * from junctionPoint where JID = "+JID);
    await sql.close();
    res.send(result.recordset[0]);
  }catch(e){
    await sql.close();
    res.status(401).send(e);
  }
});

app.get("/getLocations", [db_connect, authenticate], async(req, res)=>{
  try{
    let result = await req.db.query("exec getLocationsForUser @inUserId = " + req.userID);
    const centerPoints = center_geolocation(result.recordset);
    res.send({centerPoints, doc: result.recordset});
  }catch(e){
    res.status(500).send(e);
  }
});

app.post("/giveLocationAccess", [db_connect, authenticate], async (req, res)=> {
  if(req.userID === 1){
    try{
      let result = await req.db.query("exec addUserAccess @inUserId = " + req.body.addUserid + ", @InJID = " + req.body.JID);
      sql.close();
      res.send(result);
    }catch(e){
      sql.close();
      res.status(500).send(e);
    }
  }
});



app.listen(port, () => {
  console.log(`Started up at port http://localhost:${port}/`);
});
