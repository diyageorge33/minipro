import nodemailer from "nodemailer";

export async function sendOtpEmail(to, otp) {
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: "MiniPro App" <${process.env.EMAIL_USER}>,
    to,
    subject: "Your OTP Code",
    html: `<h2>Your Verification Code</h2>
           <p>Your OTP is <b>${otp}</b></p>`,
  });

  console.log("Ethereal Preview URL:", nodemailer.getTestMessageUrl(info));
}