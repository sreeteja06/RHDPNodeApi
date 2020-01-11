/*
 * SPDX-License-Identifier: Apache-2.0
 *     _____________  ___  
      / ___/ ___/ _ \/ _ \ 
     (__  ) /  /  __/  __/ 
    /____/_/   \___/\___  
 * File Created: Wednesday, 1st January 2020 9:18:12 am
 * Author: SreeTeja06 (sreeteja.muthyala@gmail.com)

 */
const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyASFcGqDyyrDXVOdDsVPwXaMPQstLHR7ls'
});

const { poolPromise } = require('../db/sql_connect');

const now = new Date();

const main = async () => {
  const pool = await poolPromise;
  let response;
  try {
    response = await pool.request().query(`select * from anomalyCoordinates`);
  } catch (e) {
    console.log(`error pulling anomaly coordinates ${e}`);
  }

  for (let i = 0; i < response.recordset.length; i++) {
    console.log(response.recordset[i]);
    try {
      googleMapsClient.distanceMatrix(
        {
          origins: [
            response.recordset[i].Start_Lat_in,
            response.recordset[i].Start_Long_in
          ],
          destinations: [
            response.recordset[i].End_Lat_in,
            response.recordset[i].End_Long_in
          ],
          mode: 'driving',
          departure_time: now
        },
        res => {
          console.log(res);
        }
      );
    } catch (e) {
      console.log(`error getting distance matrix ${e}`);
    }
  }
};

main();
