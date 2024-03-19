const nodemailer = require("nodemailer");
module.exports = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "099074ffda6678",
    pass: "eab1fdc57cac17",
  },
});
