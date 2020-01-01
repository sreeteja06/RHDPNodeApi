/*
 * SPDX-License-Identifier: Apache-2.0
 *         _____________  ___  
 *        / ___/ ___/ _ \/ _ \ 
 *      (__  ) /  /  __/  __/ 
 *     /____/_/   \___/\___  
 * File Created: Friday, 6th December 2019 7:32:08 pm
 * Author: SreeTeja06 (sreeteja.muthyala@gmail.com)

 */
const { poolPromise } = require('../db/sql_connect');

const main = async () => {
  try {
    const pool = await poolPromise;
    const request = await pool.request().query('select * from distDurData');
    const date = new Date(request.recordset[0].Time);
    console.log(date.toString());
  } catch (e) {
    console.log(e);
  }
};

main();
