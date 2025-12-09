// Client/src/Components/Login.jsx  (adjust path if yours differs)
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import VerifyEmail from "./VerifyEmail"; // ensure path is correct

export default function Login({ onToggleSignUp }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");       // message text
  const [isError, setIsError] = useState(false);    // success / error flag

  // show OTP page when backend requires verification
  const [showVerify, setShowVerify] = useState(false);
  const [verifyEmailValue, setVerifyEmailValue] = useState("");

  // base API (Vite)
  const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    try {
      const response = await axios.post(
        `${API}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      if (response.data.user) {
        // navigate client-side to dashboard route
        navigate("/dashboard");
      }
    } catch (error) {
      const serverMsg = error.response?.data?.message || "Error logging in";
      setIsError(true);
      setMessage(serverMsg);

      // if server asks to verify email, show OTP UI inline
      if (typeof serverMsg === "string" && serverMsg.toLowerCase().includes("verify")) {
        setVerifyEmailValue(email);
        setShowVerify(true);
      }
    }
  };

  const handleVerified = () => {
    // Hide verify UI and prompt user to login
    setShowVerify(false);
    setMessage("Email verified. Please login now.");
    setIsError(false);
  };

  // If verification required, show the VerifyEmail component (keeps same styling)
  if (showVerify) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 24 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h2 style={{ textAlign: "center" }}>Verify your email</h2>
          <p style={{ textAlign: "center", color: "#6b7280" }}>
            We sent a verification code to <strong>{verifyEmailValue}</strong>
          </p>

          <VerifyEmail email={verifyEmailValue} onVerified={handleVerified} />

          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button
              style={{ background: "transparent", border: "none", color: "#2563eb", cursor: "pointer" }}
              onClick={() => {
                setShowVerify(false);
                setMessage("");
                setIsError(false);
              }}
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={handleLogin}>
      <h2>Login Form</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit">Login</button>

      {/* message area */}
      {message && (
        <p className={isError ? "msg-error" : "msg-success"}>{message}</p>
      )}

      <p>
        Not a Member?{" "}
        <a href="#" onClick={onToggleSignUp}>
          Signup now
        </a>
      </p>
    </form>
  );
}
