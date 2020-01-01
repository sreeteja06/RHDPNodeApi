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
const path = require('path');
const fs = require('fs');

const sendMail = (subject, mailBody, mailID, attachment = null) => {
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
  let mailOptions;
  if (!attachment) {
    mailOptions = {
      from: 'RHPD Traffic Analytics Suite <rhpdsoftsol@gmail.com>',
      to: mailID,
      subject,
      text: mailBody
    };
  } else {
    console.log('sending attachment');
    mailOptions = {
      from: 'RHPD Traffic Analytics Suite <rhpdsoftsol@gmail.com>',
      to: mailID,
      subject,
      text: mailBody,
      attachments: [
        {
          filename: 'reports.pdf',
          path: path.join(
            __dirname,
            '../',
            'assets',
            `${attachment.filename}.pdf`
          )
        }
      ]
    };
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log(`Email sent: ${info.response}`);
      if (attachment) {
        fs.access(
          path.join(__dirname, '../', 'assets', `${attachment.filename}.pdf`),
          err => {
            if (!err) {
              fs.unlinkSync(
                path.join(
                  __dirname,
                  '../',
                  'assets',
                  `${attachment.filename}.pdf`
                )
              );
            } else {
              console.log(err);
            }
          }
        );
      }
    }
  });
};

module.exports = sendMail;
