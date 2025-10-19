import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

function Navbar() {
    console.log("Navbar is rendering");
  return (
    <div className="w-100">
      <nav className="navbar navbar-expand-lg navbar-light bg-light py-3 w-100 position-relative" style={{height: '100px'}}>
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <Link to="/" className="navbar-brand">
            <span className="fw-bold text-success" style={{fontSize: '40px', fontFamily: 'Poppins', paddingLeft: '50px',}}>
              QuakeSight
            </span>
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse flex-grow-0" id="navbarNav">
            <ul className="navbar-nav gap-4 mx-auto" style={{transform: 'translateX(-50%)', position: 'absolute', left: '50%'}}>
              <li className="nav-item">
                <Link to="/dashboard" className="btn btn-outline-success px-4 py-2" style={{fontSize: '18px', fontFamily: 'Poppins'}}>Dashboard</Link>
              </li>
              <li className="nav-item">
                <Link to="/prediction" className="btn btn-outline-success px-4 py-2" style={{fontSize: '18px', fontFamily: 'Poppins'}}>Risk Factor</Link>
              </li>
              <li className="nav-item">
                <Link to="/prediction-history" className="btn btn-outline-success px-4 py-2" style={{fontSize: '18px', fontFamily: 'Poppins'}}>History</Link>
              </li>
              <li className="nav-item">
                <Link to="/about" className="btn btn-outline-success px-4 py-2" style={{fontSize: '18px', fontFamily: 'Poppins'}}>About</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;