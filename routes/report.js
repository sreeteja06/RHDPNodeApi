/*
 * SPDX-License-Identifier: Apache-2.0
 *         _____________  ___  
 *        / ___/ ___/ _ \/ _ \ 
 *      (__  ) /  /  __/  __/ 
 *     /____/_/   \___/\___  
 * File Created: Thursday, 21st November 2019 8:30:42 am
 * Author: SreeTeja06 (sreeteja.muthyala@gmail.com)

 */
const express = require('express');

const router = express.Router();
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');
const mailer = require('../helpers/mail');
const slackBot = require('../helpers/slackBot');

router.post('/sendReportsEmail', async (req, res) => {
  try {
    const html = fs.readFileSync(
      path.join(__dirname, '../', 'test', 'test.html'),
      'utf8'
    );
    pdf
      .create(html, { timeout: 200000 })
      .toFile(
        path.join(__dirname, '../', 'assets', 'out.pdf'),
        async (err, result) => {
          if (err) {
            console.log(err);
            slackBot(`${err.message} ${err.stack}`);
            res.status(500).send({ err: 'error creating pdf' });
          } else {
            console.log(result);
            fs.access(
              path.join(__dirname, '../', 'assets', 'out.pdf'),
              error => {
                if (!error) {
                  fs.unlinkSync(
                    path.join(__dirname, '../', 'assets', 'out.pdf')
                  );
                } else {
                  console.log(error);
                }
              }
            );
            res.send('success');
          }
        }
      );
  } catch (e) {
    console.log(e);
    slackBot(`${e.message} ${e.stack}`);
    res.sendStatus(500).send(e);
  }
});

router.post('/dynamicHtml', async (req, res) => {
  console.log(req.body);
  const details = {
    fname: 'sree',
    lname: 'teja',
    address: 'hyderabad',
    phone: '9030603973'
  };

  res.render('crm.ejs', { details }, (err, html) => {
    if (err) {
      console.log(err);
      slackBot(`${err.message} ${err.stack}`);
      res.status(500).send({ err: 'unable to render template' });
    } else {
      const filename = Math.floor(Math.random() * 10000);
      pdf
        .create(html, {
          timeout: 200000,
          phantomPath:
            '/usr/src/app/node_modules/phantomjs-prebuilt/lib/phantom/bin/phantomjs'
        })
        .toFile(
          path.join(__dirname, '../', 'assets', `${filename}.pdf`),
          // eslint-disable-next-line no-shadow
          (err, res) => {
            if (err) {
              console.log(err);
            } else {
              console.log(res);
              const attachment = {
                filename
              };
              mailer('report', 'report body', req.body.email, attachment);
            }
          }
        );
      res.send(html);
    }
  });
});

module.exports = router;
