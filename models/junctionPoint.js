const mongoose = require('mongoose');

var junctionPointSchema = new mongoose.Schema({
	longitude: {
		type: Number,
		required: true
	},
	latitude: {
		type: Number,
		required: true
	},
	area: {
		type: String,
		required: true
	},
	city: {
		type: String,
		required: true
	},
	junctionName: {
		type: String,
		required: true
	},
	_accessedByUsers: [
		{
			userid: {
				type: mongoose.Schema.Types.ObjectId
			}
		}
	]
});

junctionPointSchema.methods.removeUserAccess = function(userId){
	let junctionPoint = this;
	return junctionPoint.update({
		$pull: {
			_accessedByUsers: {
				userid: {
					_id: userId
				}
			}
		}
	});
};

junctionPointSchema.index({
	longitude: 1,
	latitude:1,
},{
	unique: true
});

var JunctionPoint = new mongoose.model('JunctionPoint', junctionPointSchema);

module.exports = { JunctionPoint };
