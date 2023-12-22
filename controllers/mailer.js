import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const nodeConfig = {
  service: "gmail",
  auth: {
    user: process.env.OTP_EMAIL,
    pass: process.env.OTP_EMAIL_PASS,
  },
};

let transporter = nodemailer.createTransport(nodeConfig);

export const mailGenerator = (email, otp) => {
  let message = {
    from: "abraralhasanprogrammer@gmail.com",
    to: email,
    subject: "OTP",
    text: `THe One-Time-Password is ${otp}`,
  };

  transporter
    .sendMail(message)
    .then((res) => {})
    .catch((err) => console.log(err));
};

export const customMailGenerator = (email, content, subject, type = "TEXT") => {
  let message = {
    from: "abraralhasanprogrammer@gmail.com",
    to: email,
    subject: subject,
  };
  if (type === "TEXT") {
    message.text = content;
  } else {
    message.html = content;
  }

  transporter
    .sendMail(message)
    .then((res) => {})
    .catch((err) => console.log(err));
};
