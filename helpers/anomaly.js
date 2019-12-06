/*
 * SPDX-License-Identifier: Apache-2.0
 *         _____________  ___  
 *        / ___/ ___/ _ \/ _ \ 
 *      (__  ) /  /  __/  __/ 
 *     /____/_/   \___/\___  
 * File Created: Friday, 6th December 2019 7:55:12 am
 * Author: SreeTeja06 (sreeteja.muthyala@gmail.com)

 */
const request = require('request');
const { poolPromise } = require('../db/sql_connect');

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

const JIDS = [51, 52, 53, 54, 55, 56, 57, 58, 59, 60];

const main = async () => {
  for (;;) {
    JIDS.forEach(jid => {
      request(
        `http://smatraffi.southindia.cloudapp.azure.com:5000/anomalydetection/test?jid=${jid}`,
        { json: true },
        async (err, res, body) => {
          if (err) {
            return console.log(err);
          } else if (body.status == 'OK') {
            try {
              const pool = await poolPromise;
              await pool
                .request()
                .query(
                  `insert into distDurData (JID, Duration, Distance, Time) values('${jid}','${body.duration}','${body.distance}','${body.time}')`
                );
            } catch (e) {
              console.log(e);
            }
          }
          return 0;
        }
      );
    });
    // eslint-disable-next-line no-await-in-loop
    await sleep(2 * 60 * 1000);
  }
};

main();
