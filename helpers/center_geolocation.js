/* eslint-disable no-console */
const centerGeolocation = geolocations => {
  let x = 0;
  let y = 0;
  let z = 0;
  const { length } = geolocations;
  for (let i = 0; i < length; i++) {
    const long = (geolocations[i].longitude * Math.PI) / 180;
    const lat = (geolocations[i].latitude * Math.PI) / 180;
    x += Math.cos(lat) * Math.cos(long);
    y += Math.cos(lat) * Math.sin(long);
    z += Math.sin(lat);
  }
  x = parseFloat(x / length);
  y = parseFloat(y / length);
  z = parseFloat(z / length);
  const cenLong = Math.atan2(y, x);
  const cenlat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const RcenLong = (cenLong * 180) / Math.PI;
  const Rcenlat = (cenlat * 180) / Math.PI;
  return { cenLong: RcenLong, cenLat: Rcenlat };
};

module.exports = {
  centerGeolocation
};
