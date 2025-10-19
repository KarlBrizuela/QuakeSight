import logo from './logo.svg';
import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Button, Container, Row, Col } from 'react-bootstrap';
import Dash from './frontend/Dashboard'; 
import Navbar from './components/Navbar';
import Predict from './frontend/Prediction';
import About from './frontend/About';
import Footer from './components/Footer';



function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dash />} /> 
        <Route path="/prediction" element={<Predict/>}/>
        <Route path="/about" element={<About/>}/>
      </Routes>
    </Router>
  );
}

export default App;