const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "hadimghddmm@gmail.com",
    pass: "qctf lzit rgcq jxru",
  },
});

exports.SendEmail = (body, subject, receiver) => {
  const mailOptions = {
    from: "hadimghddmm@gmail.com",
    to: receiver,
    subject: subject,
    text: body,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email: ", error);
        reject(false);
      } else {
        console.log("Email sent: ", info.response);
        resolve(true);
      }
    });
  });
};
