const { center_geolocation} = require("../helpers/center_geolocation");
const  locations = require("./locations.json");
console.log(center_geolocation(locations));