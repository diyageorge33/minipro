import nodemailer from "nodemailer";

export async function sendOtpEmail(to, otp) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true", // false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log("[EMAIL] Sending OTP", otp, "to", to);

  const info = await transporter.sendMail({
    from: `"MiniPro App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your OTP Code",
    html: `<h2>Your Verification Code</h2>
           <p>Your OTP is <b>${otp}</b></p>`,
  });

  console.log("Message sent:", info.messageId);
}
