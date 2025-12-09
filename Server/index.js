// Server/index.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import pg from "pg";
import { sendOtpEmail } from "./utils/email.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

// --- Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:5173", // React dev server
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultsecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // secure: true in production with HTTPS
      // sameSite: 'lax' or 'none' depending on your setup
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// --- Postgres client
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT || 5432),
});
db
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Error connecting to database:", err));

// --- Passport local strategy (block login if not verified)
passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
      if (result.rows.length === 0) {
        return done(null, false, { message: "User not found" });
      }

      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: "Invalid credentials" });
      }

      // block login until email verified
      if (!user.is_verified) {
        return done(null, false, { message: "Please verify your email before logging in." });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// serialize/deserialize
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});

// --- Helpers
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function minutesToMs(mins) {
  return Number(mins || 10) * 60 * 1000;
}

// --- Routes

// Passport login (unchanged behavior)
app.post("/api/auth/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info?.message || "Unauthorized" });
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json({ user: { id: user.id, email: user.email } });
    });
  })(req, res, next);
});

// Signup -> create user, generate OTP, send email, return needsVerification
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

  try {
    const existing = await db.query("SELECT id FROM users WHERE email=$1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    await db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [email, hashed]);

    // generate OTP and store hashed OTP + expiry
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
    const expiry = new Date(Date.now() + minutesToMs(process.env.OTP_EXPIRY_MINUTES || 10));

    await db.query(
      "UPDATE users SET otp_hash=$1, otp_expires=$2, otp_attempts=0 WHERE email=$3",
      [otpHash, expiry, email]
    );

    // send OTP (email)
    try {
      await sendOtpEmail(email, otp);
    } catch (sendErr) {
      // log and continue — do not leak smtp details to client
      console.error("sendOtpEmail error:", sendErr);
      // For dev you may want to console.log the OTP so you can test:
      console.log("[DEV] OTP for", email, "=", otp);
    }

    return res.status(201).json({
      needsVerification: true,
      email,
      message: "Signup successful. Please verify your email.",
    });
  } catch (err) {
    console.error("Error signing up:", err);
    return res.status(500).json({ message: "Error signing up" });
  }
});

// Verify OTP
app.post("/api/auth/verify-email", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

  try {
    const r = await db.query("SELECT * FROM users WHERE email=$1", [email]);
    if (r.rows.length === 0) return res.status(404).json({ message: "User not found" });

    const user = r.rows[0];

    if (!user.otp_hash || !user.otp_expires) {
      return res.status(400).json({ message: "No verification pending" });
    }

    if (new Date(user.otp_expires) < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const ok = await bcrypt.compare(otp, user.otp_hash);
    if (!ok) {
      await db.query("UPDATE users SET otp_attempts = COALESCE(otp_attempts,0) + 1 WHERE id=$1", [user.id]);
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // mark verified and clear otp
    await db.query(
      "UPDATE users SET is_verified=true, otp_hash=NULL, otp_expires=NULL, otp_attempts=0 WHERE id=$1",
      [user.id]
    );

    return res.json({ success: true, message: "Email verified" });
  } catch (err) {
    console.error("verify-email error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Resend OTP
app.post("/api/auth/resend-verification", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  try {
    const r = await db.query("SELECT * FROM users WHERE email=$1", [email]);
    if (r.rows.length === 0) return res.status(404).json({ message: "User not found" });

    const user = r.rows[0];
    if (user.is_verified) return res.status(400).json({ message: "User already verified" });

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
    const expiry = new Date(Date.now() + minutesToMs(process.env.OTP_EXPIRY_MINUTES || 10));

    await db.query("UPDATE users SET otp_hash=$1, otp_expires=$2, otp_attempts=0 WHERE id=$3", [
      otpHash,
      expiry,
      user.id,
    ]);

    try {
      await sendOtpEmail(email, otp);
    } catch (sendErr) {
      console.error("sendOtpEmail error:", sendErr);
      console.log("[DEV] OTP for", email, "=", otp);
    }

    return res.json({ success: true, message: "Verification code resent" });
  } catch (err) {
    console.error("resend-verification error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Protected route example (keeps your existing secrets route behavior)
app.get("/secrets", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("http://localhost:5173/login");
  }
  const userEmail = req.user?.email || "User";
  res.render("secrets", { title: "User Dashboard", email: userEmail });
});

// Logout (keeps the same behavior)
app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.redirect("http://localhost:5173/login");
  });
});

// generic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
