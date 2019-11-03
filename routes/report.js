const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
// const pdf = require("html-pdf");
var fs = require("fs");
var {PythonShell} = require("python-shell");

router.post('/sendReportsEmail', async (req, res)=>{
  try{
  // var html = fs.readFileSync("./helpers/test.html", "utf8");
  var options = {
    pythonPath: "D:/home/python364x64/python",
    scriptPath: "D:/home/site/wwwroot/helpers",
    // scriptPath: "D:/projects/internship/smatraffi-api/helpers",
    pythonOptions: ["-u"]
    // args:
    // [
    //     req.query.term,
    //     req.params.id,
    //     req.session.user.searchName,
    //     req.session.user.searchKey
    // ]
  };
  console.log("before python process");
  var resultsByRel;
  PythonShell.run("test.py", options, function(err, data) {
    if (err){
      console.log(err);
    };
    // results is an array consisting of messages collected during execution
    var values = (data).toString();
    resultsByRel = values;
    console.log(resultsByRel);
    console.log("after python shell");
  });
  //   throw "err"
  //   // pdf
  //   //   .create(html, { timeout: 200000 })
  //   //   .toFile("./test.pdf", async function(err, res) {
  //   //     if (err) {
  //   //       console.log(err);
  //   //     }
  //       info = await transporter.sendMail({
  //         from: '"smatraffi" <smatraffi@outlook.com>',
  //         to: req.body.email,
  //         subject: "testing the node mailer",
  //         text: "testing start from begin to end",
  //         html:
  //           "<b>why is everyone the way it is always cant it be another way around</b>",
  //         attachments: [
  //           {
  //             filename: "reports.pdf",
  //             path: "../helpers/out.pdf"
  //           }
  //         ]
  //       });
  //       console.log("Message sent: %s", info.messageId);
  //       fs.access(result.filename, error => {
  //         if (!error) {
  //           fs.unlinkSync("../helpers/out.pdf");
  //         } else {
  //           console.log(error);
  //         }
  //       });
  //     // });
  //   res.send("success");
  // // });
  // res.sendStatus(501).end();
  }catch(e){
    console.log(e);
    res.sendStatus(500).send(e);
  }
});

module.exports = router;