import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';

import Dashboard from './pages/Dashboard';

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen text-gray-900 font-sans relative">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
