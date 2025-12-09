// Client/src/Components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch current logged-in user when the component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/auth/me", {
          credentials: "include", // send session cookie
        });

        if (res.status === 401) {
          // not logged in -> go back to login
          navigate("/login");
          return;
        }

        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error("Error fetching current user:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:3000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="dash-page dash-center">
        <p className="dash-loading-text">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dash-page">
      {/* Top navbar */}
      <header className="dash-nav">
        <div className="dash-logo">Secure User Portal</div>
        <div className="dash-nav-right">
          <span className="dash-user-text">
            Logged in as <strong>{user?.email}</strong>
          </span>
          <button className="dash-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="dash-main">
        <section className="dash-heading">
          <span className="dash-pill">Authenticated Area</span>
          <h1>User Dashboard</h1>
          <p>
            You have successfully logged in. This page is only visible to authenticated and
            email-verified users.
          </p>
        </section>

        <section className="dash-grid">
          {/* Account overview card */}
          <div className="dash-card">
            <h2>Account Overview</h2>
            <div className="dash-item">
              <span className="dash-label">Email</span>
              <span className="dash-value">{user?.email}</span>
            </div>
            <div className="dash-item">
              <span className="dash-label">Status</span>
              <span className="dash-status">Active & Verified</span>
            </div>
            <p className="dash-note">
              Your account details are securely stored in the{" "}
              <span className="dash-accent">users</span> table in PostgreSQL.
            </p>
          </div>

          {/* Implementation summary card */}
          <div className="dash-card">
            <h2>Implementation Summary</h2>
            <ul className="dash-list">
              <li>Frontend: React login & signup with OTP verification</li>
              <li>Backend: Node.js + Express REST APIs</li>
              <li>Database: PostgreSQL with normalized tables</li>
              <li>
                Security: Passwords hashed using <span className="dash-accent">bcrypt</span>
              </li>
              <li>
                Auth: <span className="dash-accent">passport-local</span> with sessions
              </li>
              <li>
                Email OTP via <span className="dash-accent">nodemailer + Gmail SMTP</span>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
