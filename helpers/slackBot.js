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
