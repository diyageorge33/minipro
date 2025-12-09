import React, { useState } from "react";
import axios from "axios";
import VerifyEmail from "./VerifyEmail";

function SignUp({ onToggleLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // NEW: track if we should show the OTP screen
  const [showVerifyPage, setShowVerifyPage] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/signup",
        { email, password }
      );

      // If backend says verification required → show OTP page
      if (response.data.needsVerification) {
        setShowVerifyPage(true);
        return;
      }

      // fallback (should not happen)
      setIsError(false);
      setMessage("Signup successful!");
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || "Error signing up");
    }
  };

  // After OTP verification, redirect to login screen
  const handleVerified = () => {
    alert("Email verified! You can now login.");
    onToggleLogin();
  };

  // ----------------------
  // RENDER: OTP PAGE FIRST IF NEEDED
  // ----------------------
  if (showVerifyPage) {
    return <VerifyEmail email={email} onVerified={handleVerified} />;
  }

  // Otherwise show normal signup form
  return (
    <form className="form" onSubmit={handleSignUp}>
      <h2>Sign Up</h2>

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

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <button type="submit">Sign Up</button>

      {message && (
        <p className={isError ? "msg-error" : "msg-success"}>{message}</p>
      )}

      <p>
        Already a member?{" "}
        <a href="#" onClick={onToggleLogin}>
          Login now
        </a>
      </p>
    </form>
  );
}

export default SignUp;
