const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

function send(toEmail = null, message = "") {
  return new Promise(async (resolve, reject) => {
    try {
      if (!toEmail)
        return reject("Please provide receipent email while sending email.");

      const res = await transporter.sendMail({
        from: process.env.EMAIL,
        to: toEmail,
        subject: "Mail Reminder Alert",
        text: message,
      });

      return resolve(res);
    } catch (err) {
      return reject(err);
    }
  });
}

module.exports = send;
