/*
 * SPDX-License-Identifier: Apache-2.0
 *         _____________  ___  
 *        / ___/ ___/ _ \/ _ \ 
 *      (__  ) /  /  __/  __/ 
 *     /____/_/   \___/\___  
 * File Created: Monday, 18th November 2019 7:28:26 pm
 * Author: SreeTeja06 (sreeteja.muthyala@gmail.com)

 */
const nodemailer = require('nodemailer');

const sendMail = (subject, mailBody, mailID) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL,
    // you can try with TLS, but port is then 587
    auth: {
      user: 'rhpdsoftsol@gmail.com', // Your email id
      pass: process.env.EMAILPASS // Your password
    }
  });

  const mailOptions = {
    from: 'rhpdsoftsol@gmail.com',
    to: mailID,
    subject,
    text: mailBody
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log(`Email sent: ${info.response}`);
    }
  });
};

module.exports = sendMail;
