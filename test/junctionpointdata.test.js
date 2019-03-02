/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
require('../config/config');

var { mongoose } = require('../db/mongoose');
var { JunctionPoint } = require('../models/junctionPoint');
var { User } = require('../models/user');
const { ObjectID } = require('mongodb');

const userId = new ObjectID();

JunctionPoint.updateOne({ _id: '5c758227ed59de1ba821dfb3'},{
	'$push': { '_accessedByUsers': {'_id':ObjectID('5c758227ed59de1ba821dfb3')}} 
}).then((res)=>{
	console.log(res);
}).catch((e)=>{
	console.log(e);
});

// var junctionPoint = new JunctionPoint({
//   longitude: "43.31",
//   latitude: "24211.343",
//   area: "secundrabad",
//   city: "hyderabad",
//   junctionName: "gachi",
//   _accessedByUsers: [ObjectID("5c74ebb4c354c24ec889034c")]
// });

// junctionPoint
//   .save()
//   .then(doc => {
//     console.log(doc);
//   })
//   .catch(e => {
//     console.log(e);
//   });

// JunctionPoint.find({
//   _accessedByUsers: { _id: "5c74f450205159546c6a8ff1" }
// })
//   .then(doc => {
//     console.log(doc);
//   })
//   .catch(e => {
//     console.log(e);
//   });

// JunctionPoint.remove({ "_id": ObjectID("5c75017953e42937e0d8ef27") }).then((result) => {
//   res.send(result);
// }).catch((e) => {
//   res.send(e);
// })
