import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./VerifyEmail.css";

/**
 * Props:
 *  - email (string) : email address for verification
 *  - onVerified (fn) : callback when verified
 */
export default function VerifyEmail({ email, onVerified }) {
  //const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";
const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";


  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef([]);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔁 RESEND COUNTDOWN LOGIC
  const RESEND_WAIT = 45; // seconds
  const [timeLeft, setTimeLeft] = useState(RESEND_WAIT);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (val, index) => {
    if (!/^\d?$/.test(val)) return; // digits only

    const newArr = [...digits];
    newArr[index] = val;
    setDigits(newArr);

    if (val && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const arr = pasted.split("");
    const newDigits = ["", "", "", "", "", ""];
    arr.forEach((d, i) => (newDigits[i] = d));
    setDigits(newDigits);
    inputsRef.current[arr.length - 1]?.focus();
    e.preventDefault();
  };

  // 🔐 SUBMIT OTP
  const submitOtp = async () => {
    const otp = digits.join("");
    if (otp.length !== 6) {
      setError("Enter all 6 digits");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API}/api/auth/verify-email`, {
        email,
        otp,
      });

      if (res.data.success) {
        setInfo("Email verified successfully!");
        setTimeout(() => onVerified(), 800);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 RESEND OTP
  const resendOtp = async () => {
    if (timeLeft !== 0) return;

    try {
      setLoading(true);
      const res = await axios.post(`${API}/api/auth/resend-verification`, { email });

      if (res.data.success) {
        setInfo("Verification code resent!");
        setTimeLeft(RESEND_WAIT);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="otp-page-card">
        <div className="otp-icon">✉️</div>

        <h2 className="otp-title">Verify Your Email</h2>
        <p className="otp-sub">
          Enter the 6-digit code we sent to <strong>{email}</strong>
        </p>

        <div className="otp-inputs" onPaste={handlePaste}>
          {digits.map((d, index) => (
            <input
              key={index}
              maxLength="1"
              value={d}
              className="otp-box"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              ref={(el) => (inputsRef.current[index] = el)}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>

        {/* CONFIRM BUTTON */}
        <button className="otp-button" disabled={loading} onClick={submitOtp}>
          {loading ? "Please wait..." : "Confirm"}
        </button>

        {/* RESEND AREA */}
        <div className="resend-area">
          {timeLeft > 0 ? (
            <p className="resend-count">Resend available in {timeLeft}s</p>
          ) : (
            <button className="resend-btn" onClick={resendOtp}>
              Resend Code
            </button>
          )}
        </div>

        {error && <p className="error-msg">{error}</p>}
        {info && <p className="info-msg">{info}</p>}
      </div>
    </div>
  );
}
