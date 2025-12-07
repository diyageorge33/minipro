import React, { useState } from "react";
import axios from "axios";

function SignUp({ onToggleLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

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

      // Success message display
      setIsError(false);
      setMessage("Signup successful! Please login.");

      setTimeout(() => {
        onToggleLogin();  // Switch back to login form after delay
      }, 1200);

    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || "Error signing up");
    }
  };

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
