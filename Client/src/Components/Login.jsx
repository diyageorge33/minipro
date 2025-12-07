import React, { useState } from "react";
import axios from "axios";

function Login({ onToggleSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");       // message text
  const [isError, setIsError] = useState(false);    // success / error flag

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");          // clear old messages

    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/login",
        { email, password },
        { withCredentials: true }
      );

      if (response.data.user) {
        // ✅ no alert, just redirect
        window.location.href = "http://localhost:3000/secrets";
      }
    } catch (error) {
      // show error text inside form instead of popup
      setIsError(true);
      setMessage(error.response?.data?.message || "Error logging in");
    }
  };

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

export default Login;
