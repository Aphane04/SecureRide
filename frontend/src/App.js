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
import DriverOverview from './pages/dashboard/DriverOverview';
import DriverHistory from './pages/dashboard/DriverHistory';
import DriverContacts from './pages/dashboard/DriverContacts';
import DriverAccount from './pages/dashboard/DriverAccount';

import AdminDash from './pages/dashboard/AdminDash';
import AdminOverview from './pages/dashboard/AdminOverview';
import AdminDrivers from './pages/dashboard/AdminDrivers';
import AdminPassengers from './pages/dashboard/AdminPassengers';
import AdminAlerts from './pages/dashboard/AdminAlerts';
import AdminSettings from './pages/dashboard/AdminSettings';

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
          <ProtectedRoute allowedRoles={['Driver']}>
            <Layout><DriverDash /></Layout>
          </ProtectedRoute>
        }>
          <Route index element={<DriverOverview />} />
          <Route path="history" element={<DriverHistory />} />
          <Route path="contacts" element={<DriverContacts />} />
          <Route path="account" element={<DriverAccount />} />
        </Route>

       <Route path="/dashboard/admin" element={
  <ProtectedRoute allowedRoles={['Admin']}><Layout><AdminDash /></Layout></ProtectedRoute>
}>
  <Route index element={<AdminOverview />} />
  <Route path="drivers" element={<AdminDrivers />} />
  <Route path="passengers" element={<AdminPassengers />} />
  <Route path="alerts" element={<AdminAlerts />} />
</Route>

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;