const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const pdf = require("html-pdf");
var fs = require("fs");

router.post('/sendReportsEmail', async (req, res)=>{
  try{
  var html = fs.readFileSync("./helpers/test.html", "utf8");
  let transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
      user: "smatraffi@outlook.com",
      pass: "Webapp@1234"
    }
  });
  let info;
  pdf
    .create(html, { timeout: 200000 })
    .toFile("./test.pdf", async function(err, res) {
      if (err) {
        console.log(err);
      }
      console.log(res.filename);
      info = await transporter.sendMail({
        from: '"smatraffi" <smatraffi@outlook.com>',
        to: req.body.email,
        subject: "testing the node mailer",
        text: "testing start from begin to end",
        html:
          "<b>why is everyone the way it is always cant it be another way around</b>",
        attachments: [
          {
            filename: "reports.pdf",
            path: res.filename
          }
        ]
      });
      console.log("Message sent: %s", info.messageId);
      fs.access(result.filename, error => {
        if (!error) {
          fs.unlinkSync(result.filename);
        } else {
          console.log(error);
        }
      });
    });
  res.send("success");
  }catch(e){
    res.sendStatus(500).send(e);
  }
});

module.exports = router;