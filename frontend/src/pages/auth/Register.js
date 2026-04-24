import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Ensure you have installed axios: npm install axios

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '', surname: '', idNumber: '', dob: '', gender: '',
    ethnicity: '', accountType: 'Passenger', contact: '', email: '',
    address: '', password: '', confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Logic: Password match check
    if (formData.password !== formData.confirmPassword) {
        return alert("Passwords do not match");
    }

    try {
      // 2. API Call to your FastAPI Backend
      const response = await axios.post('http://127.0.0.1:8000/register', {
        email: formData.email,
        password: formData.password,
        full_name: `${formData.firstName} ${formData.surname}`,
        id_number: formData.idNumber,
        phone: formData.contact,
        address: formData.address,
        dob: formData.dob,
        gender: formData.gender,
        role: formData.accountType // Maps 'accountType' to 'role' in backend
      });

      console.log("Registration Successful:", response.data);

      // 3. Conditional Navigation as per requirements
      if (formData.accountType === "Admin") {
        alert("Admin account created. Redirecting to Login.");
        navigate('/login'); 
      } else {
        // Redirect Passengers and Drivers to Verification Flow
        navigate('/verify/consent', { state: { userId: response.data.id } }); 
      }

    } catch (error) {
      console.error("Registration Error:", error);
      alert(error.response?.data?.detail || "Registration failed. Please try again.");
    }
  };

  const inputClass = "w-full bg-[#1a1a1a] border-none text-white p-3 rounded focus:ring-2 focus:ring-green-500 outline-none";

  // Reusable helper to update state for any field
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
      <div className="max-w-4xl w-full bg-[#121212] p-10 rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-8 border-l-4 border-green-600 pl-4">Create Account</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <input type="text" placeholder="First Name" required className={inputClass} 
            value={formData.firstName} onChange={e => handleChange('firstName', e.target.value)} />
          
          <input type="text" placeholder="Surname" required className={inputClass} 
            value={formData.surname} onChange={e => handleChange('surname', e.target.value)} />
          
          <input type="text" placeholder="ID Number" required className={inputClass} 
            value={formData.idNumber} onChange={e => handleChange('idNumber', e.target.value)} />
          
          <input type="date" placeholder="Date of Birth" required className={inputClass} 
            value={formData.dob} onChange={e => handleChange('dob', e.target.value)} />
          
          <select className={inputClass} value={formData.gender} onChange={e => handleChange('gender', e.target.value)}>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          
          <input type="text" placeholder="Ethnicity" className={inputClass} 
            value={formData.ethnicity} onChange={e => handleChange('ethnicity', e.target.value)} />
          
          <select className={inputClass} value={formData.accountType} onChange={e => handleChange('accountType', e.target.value)}>
            <option value="Passenger">Passenger</option>
            <option value="Driver">Driver</option>
            <option value="Admin">Admin</option>
          </select>
          
          <input type="tel" placeholder="Contact Number" className={inputClass} 
            value={formData.contact} onChange={e => handleChange('contact', e.target.value)} />
          
          <input type="email" placeholder="Email Address" required className={inputClass} 
            value={formData.email} onChange={e => handleChange('email', e.target.value)} />
          
          <input type="text" placeholder="Physical Address" className={inputClass} 
            value={formData.address} onChange={e => handleChange('address', e.target.value)} />
          
          <input type="password" placeholder="Password" required className={inputClass} 
            value={formData.password} onChange={e => handleChange('password', e.target.value)} />
          
          <input type="password" placeholder="Confirm Password" required className={inputClass} 
            value={formData.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} />
          
          <button type="submit" className="md:col-span-2 bg-[#008751] hover:bg-green-700 text-white font-bold py-4 rounded transition mt-4">
            Continue to Verification
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;