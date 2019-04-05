// eslint-disable-next-line no-unused-vars
var env = process.env.NODE_ENV || "development";
// eslint-disable-next-line no-console

// eslint-disable-next-line no-constant-condition
// eslint-disable-next-line no-constant-condition
if (env === "development" || "test") {
	var config = require("./config.json");
	var envConfig = config[env];
	Object.keys(envConfig).forEach(key => {
		process.env[key] = envConfig[key];
	});
}
