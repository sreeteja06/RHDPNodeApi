/*
 * SPDX-License-Identifier: Apache-2.0
 *         _____________  ___  
 *        / ___/ ___/ _ \/ _ \ 
 *      (__  ) /  /  __/  __/ 
 *     /____/_/   \___/\___  
 * File Created: Thursday, 28th November 2019 10:46:34 pm
 * Author: SreeTeja06 (sreeteja.muthyala@gmail.com)

 */
// eslint-disable-next-line import/no-extraneous-dependencies
const Slack = require('node-slack');

const slack = new Slack(process.env.SLACKWEBHOOK);

module.exports = message => {
  console.log('slack');
  slack.send({
    text: message,
    channel: '#deploy500events',
    username: 'Deploy Errors',
    icon_emoji: ':japanese_ogre:'
  });
};
// module.exports = message => {
//   console.log(process.env.SLACKWEBHOOK);
//   const options = {
//     method: 'POST',
//     url:
//       'https://hooks.slack.com/services/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',
//     headers: {
//       'cache-control': 'no-cache',
//       Connection: 'keep-alive',
//       'Content-Length': '277',
//       'Accept-Encoding': 'gzip, deflate',
//       Host: 'hooks.slack.com',
//       'Cache-Control': 'no-cache',
//       Accept: '*/*',
//       'Content-Type': 'application/x-www-form-urlencoded'
//     },
//     form: {
//       payload: `{"channel": "#deploy500events", "username": "webhookbot", "text": "${message}", "icon_emoji": ":japanese_ogre:"}`
//     }
//   };
//   // eslint-disable-next-line no-unused-vars
//   request(options, (error, response, body) => {
//     console.log('request');
//     if (error) {
//       console.log(error);
//     }
//   });
// };
