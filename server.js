require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
var { mongoose } = require('./db/mongoose');

let {User} = require('./models/user');

let app = express();
const port = process.env.PORT;
app.use(bodyParser.json());

app.post('/users', (req,res)=>{
    var user = new User({
        email: req.body.email,
        password: req.body.password
    });

    user.save().then(()=>{
        return user.generateAuthToken();
    }).then((token)=>{
        res.header('x-auth', token).send(user);
    }).catch((err)=>{
        res.status(400).send(err)
    })
});

app.listen(port, () => {
    console.log(`Started up at port ${port}`);
});

module.exports = { app };