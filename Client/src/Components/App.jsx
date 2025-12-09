// Client/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthForm from "./Authentication"; // keep path if file is in src
import Dashboard from "./Dashboard";     // keep path if file is in src

function App() {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<AuthForm />} />
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
}

export default App;
