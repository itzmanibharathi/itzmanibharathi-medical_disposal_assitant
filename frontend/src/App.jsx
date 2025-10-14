import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import AboutUs from './pages/AboutUs';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-slate-100">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/about" element={<AboutUs />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;