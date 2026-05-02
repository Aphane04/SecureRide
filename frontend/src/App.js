import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Consent from './pages/verification/Consent';
import IDUpload from './pages/verification/IDUpload';
import FaceScan from './pages/verification/FaceScan';

import PassengerDash from './pages/dashboard/PassengerDash';
import PassengerOverview from './pages/dashboard/PassengerOverview';
import PassengerRide from './pages/dashboard/PassengerRide';
import PassengerHistory from './pages/dashboard/PassengerHistory';
import PassengerContacts from './pages/dashboard/PassengerContacts';
import PassengerAccount from './pages/dashboard/PassengerAccount';

import DriverDash from './pages/dashboard/DriverDash';
import AdminDash from './pages/dashboard/AdminDash';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/verify/consent" element={<Consent />} />
        <Route path="/verify/id-upload" element={<IDUpload />} />
        <Route path="/verify/face-scan" element={<FaceScan />} />

        <Route path="/dashboard/passenger" element={
          <ProtectedRoute allowedRoles={['Passenger']}>
            <Layout><PassengerDash /></Layout>
          </ProtectedRoute>
        }>
          <Route index element={<PassengerOverview />} />
          <Route path="ride" element={<PassengerRide />} />
          <Route path="history" element={<PassengerHistory />} />
          <Route path="contacts" element={<PassengerContacts />} />
          <Route path="account" element={<PassengerAccount />} />
        </Route>

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