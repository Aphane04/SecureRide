import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Consent from './pages/verification/Consent';
import IDUpload from './pages/verification/IDUpload';
import FaceScan from './pages/verification/FaceScan';
import PassengerDash from './pages/dashboard/PassengerDash';
import DriverDash from './pages/dashboard/DriverDash';
import AdminDash from './pages/dashboard/AdminDash';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Verification Flow (Protected) */}
        <Route path="/verify/consent" element={<Consent />} />
<Route path="/verify/id-upload" element={<IDUpload />} />
<Route path="/verify/face-scan" element={<FaceScan />} />

        {/* Dashboards (Role Specific) */}
        <Route path="/dashboard/passenger" element={
          <ProtectedRoute allowedRoles={['Passenger']}><Layout><PassengerDash /></Layout></ProtectedRoute>
        } />
        
        <Route path="/dashboard/driver" element={
          <ProtectedRoute allowedRoles={['Driver']}><Layout><DriverDash /></Layout></ProtectedRoute>
        } />

        <Route path="/dashboard/admin" element={
          <ProtectedRoute allowedRoles={['Admin']}><Layout><AdminDash /></Layout></ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;