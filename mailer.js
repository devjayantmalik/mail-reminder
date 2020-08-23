const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const email = process.env.EMAIL;
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const url = process.env.APP_URL;
const refresh_token = process.env.REFRESH_TOKEN;

const client = new OAuth2(client_id, client_secret, url);

client.setCredentials({
  refresh_token: refresh_token,
});

const accessToken = client.getAccessToken();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: email,
    clientId: client_id,
    clientSecret: client_secret,
    refreshToken: refresh_token,
    accessToken: accessToken,
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
