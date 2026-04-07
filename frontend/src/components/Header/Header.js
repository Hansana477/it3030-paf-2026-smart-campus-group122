import React from "react";
import "./Header.css";

function Header({ title, userName, roleLabel, onLogout }) {
  return (
    <header className="app-header">
      <div>
        <p className="app-header-badge">{roleLabel}</p>
        <h1 className="app-header-title">{title}</h1>
      </div>

      <div className="app-header-user">
        <p className="app-header-greeting">Hi, {userName}</p>
        <button type="button" className="app-header-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
