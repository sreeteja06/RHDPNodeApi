require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const { ObjectID } = require('mongodb');
const cors = require('cors');
const { admin_id } = require('./h-adminid.json');

// eslint-disable-next-line no-unused-vars
var { mongoose } = require('./db/mongoose');
let { User } = require('./models/user');
let { authenticate } = require('./middleware/authenticate');
let { JunctionPoint } = require('./models/junctionPoint');

let app = express();
app.use(cors());
const port = process.env.PORT;
app.use(bodyParser.json());

app.get('/',(req, res)=>{
	res.send('welcome to the rhdp node api');
});

app.post('/newJunctionPoint', authenticate, (req, res) => {           //to update a new location in the database
	let junctionPoint = new JunctionPoint({
		longitude: req.body.longitude,
		latitude: req.body.latitude,
		area: req.body.area,
		city: req.body.city,
		junctionName: req.body.junctionName,
		_accessedByUsers: [{ _id: req.user._id }, {_id: admin_id}]
	});
	junctionPoint.save().then((doc)=>{
		res.send(doc);
	}).catch((e)=>{
		res.send(e);
	});
});

app.get('/getLocations', authenticate, (req,res)=>{                 //to get the locations based on who is logged on
	JunctionPoint.find({
		_accessedByUsers: { _id: req.user._id.toString() }
	})
		.then(doc => {
			res.send(doc);
		})
		.catch(e => {
			res.send(e);
		});
});

app.post('/giveLocationAccess', authenticate, (req, res)=>{
	if(req.user._id.toString() === (admin_id.toString())){                                 //only admin has the access to give the access
		JunctionPoint.updateOne({ _id: req.body.locationID.toString() }, {
			'$push': { '_accessedByUsers': { '_id': ObjectID(req.body.addUserid.toString()) } }
		}).then((response) => {
			res.send(response);
		}).catch((e) => {
			res.send(e);
		});
	}
	else{
		res.status(400).send({'err':'if statement not passed'});
	}
});

app.get('/users/me', authenticate, (req, res) => {                  //example for authentication check
	res.send(req.user);
});

app.post('/users/login', (req, res) => {                            //login the user, given the login credentials in the body
	var body = _.pick(req.body, ['email', 'password']);
	User.findByCredentials(body.email, body.password)
		.then(user => {
			user.generateAuthToken().then(token => {
				res.append('Access-Control-Allow-Headers', 'x-auth, Content-Type');
				res.append('Access-Control-Expose-Headers', 'x-auth, Content-Type');
				res.header('x-auth', token).send({user, token});
			});
		})
		.catch(e => {
			res.status(401).send(e);
		});
});

app.post('/users', (req, res) => {                                  //to create a new user given, password and email
	let password;
	bcrypt.genSalt(10, (err, salt) => {
		if (err) {
			res.send(500).send(err);
		}
		bcrypt.hash(req.body.password, salt, (err, hash) => {
			if (err) {
				res.send(500).send(err);
			}
			password = hash;
			var user = new User({
				email: req.body.email,
				password,
				name: req.body.name,
				phone: req.body.phone
			});
			user
				.save()
				.then(() => {
					return user.generateAuthToken();
				})
				.then(token => {
					res.header('x-auth', token).send(user);
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
	});
});

app.delete('/removeJunctionPoint', authenticate, (req, res)=>{             //removes the junctionpoint given the locationid
	// if(req.user._id === admin._id){
	// if only admin can remove the location
	// }
	JunctionPoint.remove({'_id': ObjectID(req.query.locationID.toString())}).then((result)=>{
		res.send(result);
	}).catch((e)=>{
		res.send(e);
	});
});

app.delete('/removeJunctionPointAccess', authenticate, (req, res)=>{
	if(req.user._id === req.body.userID || req.user._id === admin_id.toString()){           //removes only if the user tries to remove his own access can add //req.user._id===admin._id
		JunctionPoint.findOne({'_id': ObjectID(req.query.userID.toString())}).then((junctionPoint)=>{
			junctionPoint.removeUserAccess(req.query.userID).then(()=>{
				res.status(200).send();
			},()=>{
				res.status(400).send();
			});
		});
	}
});

app.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(`Started up at port http://localhost:${port}/`);
});

module.exports = { app };