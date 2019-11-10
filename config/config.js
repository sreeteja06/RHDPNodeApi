// eslint-disable-next-line no-unused-vars
var env = process.env.NODE_ENV || "development";
// eslint-disable-next-line no-console

// eslint-disable-next-line no-constant-condition
// eslint-disable-next-line no-constant-condition
if(env === "test"){
	console.log("running test server");
	var config = require("./test.json");
	Object.keys(config).forEach(key => {
		process.env[key] = config[key];
	});
}

if (env === "development") {
  var config = require("./config.json");
	Object.keys(config).forEach(key => {
		process.env[key] = config[key];
	});
}
