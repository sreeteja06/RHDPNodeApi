require("./config/config");

const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const { ObjectID } = require("mongodb");

var { mongoose } = require("./db/mongoose");
let { User } = require("./models/user");
let { authenticate } = require("./middleware/authenticate");
let { JunctionPoint } = require("./models/junctionPoint");

let app = express();
const port = process.env.PORT;
app.use(bodyParser.json());

app.post("/newJunctionPoint", authenticate, (req, res) => {           //to update a new location in the database
  let junctionPoint = new JunctionPoint({
    longitude: req.body.longitude,
    latitude: req.body.latitude,
    area: req.body.area,
    city: req.body.city,
    junctionName: req.body.junctionName,
    _accessedByUsers: [{ _id: req.user._id }]
  });
  junctionPoint.save().then((doc)=>{
      res.send(doc);
  }).catch((e)=>{
      res.send(e);
  })
});

app.get("/getLocations", authenticate, (req,res)=>{                 //to get the locations based on who is logged on
    JunctionPoint.find({
      _accessedByUsers: { _id: req.user._id.toString() }
    })
      .then(doc => {
        res.send(doc);
      })
      .catch(e => {
        res.send(e);
      });
})

app.get("/users/me", authenticate, (req, res) => {                  //example for authentication check
  res.send(req.user);
});

app.post("/users/login", (req, res) => {                            //login the user, given the login credentials in the body
  var body = _.pick(req.body, ["email", "password"]);
  User.findByCredentials(body.email, body.password)
    .then(user => {
      user.generateAuthToken().then(token => {
        res.header("x-auth", token).send(user);
      });
    })
    .catch(e => {
      res.status(400).send();
    });
});

app.post("/users", (req, res) => {                                  //to create a new user given, password and email
  let password;
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      console.log(err);
    }
    bcrypt.hash(req.body.password, salt, (err, hash) => {
      if (err) {
        console.log(err);
      }
      password = hash;
      var user = new User({
        email: req.body.email,
        password
      });
      user
        .save()
        .then(() => {
          return user.generateAuthToken();
        })
        .then(token => {
          res.header("x-auth", token).send(user);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });
  });
});

app.delete('/users/me/logout', authenticate, (req, res)=>{            //removes the current token, i.e. logout the user
  req.user.removeToken(req.token).then(()=>{
    res.status(200).send();
  },()=>{
    res.status(400).send();
  })
})

app.listen(port, () => {
  console.log(`Started up at port ${port}`);
});

module.exports = { app };
