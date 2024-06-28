const nodemailer = require("nodemailer");
module.exports = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false,
  },
  auth: {
    user: "support1234@dayumstore.in",
    pass: "Kvfgroups@2024",
  },
});
