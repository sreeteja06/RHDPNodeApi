/* eslint-disable no-console */
const center_geolocation = geolocations => {
  let x = 0,
    y = 0,
    z = 0;
  const length = geolocations.length;
  for (let i = 0; i < length; i++) {
    let long = (geolocations[i].longitude * Math.PI) / 180;
    let lat = (geolocations[i].latitude * Math.PI) / 180;
    x = x + Math.cos(lat) * Math.cos(long);
    y = y + Math.cos(lat) * Math.sin(long);
    z = z + Math.sin(lat);
  }
  x = parseFloat(x / length);
  y = parseFloat(y / length);
  z = parseFloat(z / length);
  let cenLong = Math.atan2(y, x);
  let cenlat = Math.atan2(z, Math.sqrt(x * x + y * y));
  let RcenLong = (cenLong * 180) / Math.PI;
  let Rcenlat = (cenlat * 180) / Math.PI;
  return { cenLong: RcenLong, cenLat: Rcenlat };
};

module.exports = {
  center_geolocation
};
