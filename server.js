require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const _ = require('lodash');

var { mongoose } = require('./db/mongoose');
let {User} = require('./models/user');
let {authenticate} = require('./middleware/authenticate');

let app = express();
const port = process.env.PORT;
app.use(bodyParser.json());



app.get('/users/me', authenticate ,(req, res) => {                  //example for authentication check
    res.send(req.user);
})

app.post('/users/login', (req,res)=>{
    var body = _.pick(req.body, ['email', 'password']);
    User.findByCredentials(body.email, body.password).then((user)=>{
        user.generateAuthToken().then((token)=>{
            res.header('x-auth', token).send(user);
        });
        // res.send(user);
    }).catch((e)=>{
        res.status(400).send();
    })
})

app.post('/users', (req,res)=>{
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
            user.save().then(() => {
                return user.generateAuthToken();
            }).then((token) => {
                res.header('x-auth', token).send(user);
            }).catch((err) => {
                res.status(400).send(err)
            })
        });
    });
});

app.listen(port, () => {
    console.log(`Started up at port ${port}`);
});

module.exports = { app };