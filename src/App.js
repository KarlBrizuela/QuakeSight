import logo from './logo.svg';
import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Button, Container, Row, Col } from 'react-bootstrap';
import Dash from './frontend/Dashboard'; 
import Navbar from './components/Navbar';
import Predict from './frontend/Prediction';
import Ab from './frontend/About';
import PredictionHistory from './frontend/PredictionHistory';
// Import Firebase tests for browser console
import './firebase/testInBrowser';
import './firebase/simpleTest';


function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dash />} /> 
        <Route path="/prediction" element={<Predict/>}/>
        <Route path="/prediction-history" element={<PredictionHistory/>}/>
        <Route path="/about" element={<Ab/>}/>
        
      </Routes>
    </Router>
  );
}

export default App;