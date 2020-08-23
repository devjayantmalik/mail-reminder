const express = require("express");
const exphbs = require("express-handlebars");
const monk = require("monk");
const send = require("./mailer");

// local development docker container address for mongodb
// const uri = process.env.MONGODB_URI || "172.17.0.2:27017/mail-reminder";
const uri = process.env.MONGODB_URI;
// setup database and app
const db = monk(uri);
const app = express();

// create collections inside database
let schedules = db.get("schedules");
schedules.createIndex("id email");

// configure the app
app.use(express.urlencoded({ extended: false }));
app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");
app.use(express.static("public"));

// configure app routes for root web pages
app.get("/", (req, res) => {
  return res.render("scheduler");
});

app.get("/cancel", (req, res) => {
  return res.render("cancel-schedules");
});

// handle routes related to backend
// handle scheduler / form submission
app.post("/", (req, res, next) => {
  // extract information
  const { email, message, date } = req.body;

  // validate information
  if (!email || !message || !date) {
    return res.render("scheduler", {
      error: "Email, message and date are required!",
    });
  }

  // add the mail to our database
  schedules.insert({ email, message, date: new Date(date).toDateString() });

  // notify the user
  return res.render("scheduler", {
    result: `Thanks, You will receive your message on ${new Date(
      date
    ).toDateString()} at: ${email} `,
  });
});

// handle cancel /cancel for submission
// Returns all schedules associated with provided email.
app.post("/cancel", async (req, res, next) => {
  // get information
  const { email } = req.body;

  // validate information
  if (!email) {
    return res.render("cancel-schedules", { error: "Email is required.!" });
  }

  // get all schedules related to provided email
  const results = await schedules.find({ email });

  // check if schedules
  if (results.length === 0) {
    return res.render("cancel-schedules", { error: "No schedules found.!" });
  }

  return res.render("cancel-schedules", { schedules: results });
});

app.get("/delete/:id", (req, res) => {
  // extract schedule id
  const { id } = req.params;

  // remove the schedule with provided id.
  schedules.remove({ _id: id });

  // redirect the user to /
  return res.redirect("/cancel");
});

// process emails that needs to be sent today
app.get("/process", async (req, res) => {
  // get all the emails that have todays date
  const emails = await schedules.find({ date: new Date().toDateString() });

  // send an email for each email
  emails.forEach(async (mail) => {
    try {
      // send an email
      await send(mail.email, mail.message);

      // update the database and remove the email from database
      await schedules.remove({ _id: mail._id });
    } catch (error) {
      console.log(error);
    }
  });

  if (!emails.length) {
    return res.render("scheduler", {
      error: "No emails found to send.",
    });
  }

  return res.render("scheduler", {
    result:
      "All emails sent, please note that the invalid emails or failed emails have been discarded.",
  });
});

app.use((error, req, res, next) => {
  return res.render("error", { error: error.message });
});

// start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started at: http://0.0.0.0:${port}`);
});
