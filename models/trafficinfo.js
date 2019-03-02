const  mongoose = require('mongoose');

let trafficInfoSchema = new mongoose.Schema({
	trafficCongestion: {
		type: Number,
		require: true
	},
	latestTimer: [
		{
			value: {
				type: Number
			}   
		}
	],
	roadNames: [
		{
			roadname: {
				type: String,
				trim: true,
			}
		}
	],
	timeStamp: {
		type: Date,
		require: true,
	},
	pedestrianTime: {
		type: Number,
		require: true,
	},
	pastTimers:[[{
		value: {
			type: Number
		}
	}]],
	numberOfPhases: {
		value:{
			type: Number,
			require: true,
		}
	}
});

let TrafficInfo = new mongoose.model('TrafficInfo', trafficInfoSchema);

module.exports = { TrafficInfo };
