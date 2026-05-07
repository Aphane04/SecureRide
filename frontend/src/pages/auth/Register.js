import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../utils/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '', surname: '', idNumber: '', dob: '', gender: '',
    ethnicity: '', accountType: 'Passenger', contact: '', email: '',
    address: '', password: '', confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return alert("Passwords do not match");
    }

    try {
      const response = await authAPI.register({
        email: formData.email,
        password: formData.password,
        full_name: `${formData.firstName} ${formData.surname}`,
        id_number: formData.idNumber,
        phone: formData.contact,
        address: formData.address,
        dob: formData.dob,
        gender: formData.gender,
        role: formData.accountType,
        ethnicity: formData.ethnicity
      });

      if (formData.accountType === "Admin") {
        alert("Admin account created. Redirecting to Login.");
        navigate('/login');
      } else {
        navigate('/verify/consent', { state: { userId: response.data.id } });
      }
    } catch (error) {
      alert(error.response?.data?.detail || "Registration failed.");
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Modern UI Classes
  const inputContainer = "flex flex-col gap-1.5";
  const labelClass = "text-[10px] uppercase tracking-widest text-gray-500 font-bold ml-1";
  const inputClass = "w-full bg-[#111111] border border-white/5 text-white p-3 rounded-xl focus:border-green-500 focus:bg-[#1a1a1a] outline-none transition-all text-sm placeholder:text-gray-700";

  return (
    <div className="flex min-h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* LEFT SIDE: Visual Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-16 overflow-hidden">
        {/* Abstract Background Gradient */}
        <div className="absolute inset-0 bg-[#062419] z-0">
          <div className="absolute top-1/4 -left-1/4 w-[100%] h-[100%] bg-[#008751] rounded-full blur-[160px] opacity-20 animate-pulse" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-green-500 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.4)]" />
            <span className="font-black text-xl tracking-tighter">SecureRide</span>
          </div>
          
          <h1 className="text-6xl font-black tracking-tighter leading-[0.9] mb-6">
            Get Started <br /> <span className="text-gray-500">with Us</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
            Complete these three simple steps to register your AI-monitored account.
          </p>
        </div>

        {/* Step Indicators */}
        <div className="relative z-10 flex gap-4">
          <div className="bg-white p-6 rounded-3xl w-40 text-black shadow-2xl">
            <span className="text-xs font-black mb-2 block">01</span>
            <p className="text-[11px] font-bold leading-tight">Create your secure account</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl w-40 text-gray-500">
            <span className="text-xs font-black mb-2 block text-gray-600">02</span>
            <p className="text-[11px] font-bold leading-tight">Verify Identity & Liveness</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl w-40 text-gray-500">
            <span className="text-xs font-black mb-2 block text-gray-600">03</span>
            <p className="text-[11px] font-bold leading-tight">Access your Dashboard</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Form Panel */}
      <div className="w-full lg:w-[55%] bg-black p-8 md:p-16 flex flex-col justify-center overflow-y-auto max-h-screen">
        <div className="max-w-xl mx-auto w-full">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black tracking-tight mb-2">Sign Up Account</h2>
            <p className="text-gray-500 text-sm">Please enter your details to create your secure profile.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            
            <div className={inputContainer}>
              <label className={labelClass}>First Name</label>
              <input type="text" placeholder="eg. John" required className={inputClass} 
                value={formData.firstName} onChange={e => handleChange('firstName', e.target.value)} />
            </div>

            <div className={inputContainer}>
              <label className={labelClass}>Surname</label>
              <input type="text" placeholder="eg. Doe" required className={inputClass} 
                value={formData.surname} onChange={e => handleChange('surname', e.target.value)} />
            </div>

            <div className={inputContainer}>
              <label className={labelClass}>ID Number</label>
              <input type="text" placeholder="ID Card Number" required className={inputClass} 
                value={formData.idNumber} onChange={e => handleChange('idNumber', e.target.value)} />
            </div>

            <div className={inputContainer}>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" required className={inputClass} 
                value={formData.dob} onChange={e => handleChange('dob', e.target.value)} />
            </div>

            <div className={inputContainer}>
              <label className={labelClass}>Gender</label>
              <select className={inputClass} value={formData.gender} onChange={e => handleChange('gender', e.target.value)}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className={inputContainer}>
              <label className={labelClass}>Ethnicity</label>
              <input type="text" placeholder="Optional" className={inputClass} 
                value={formData.ethnicity} onChange={e => handleChange('ethnicity', e.target.value)} />
            </div>

            <div className={inputContainer}>
              <label className={labelClass}>Account Type</label>
              <select className={inputClass} value={formData.accountType} onChange={e => handleChange('accountType', e.target.value)}>
                <option value="Passenger">Passenger</option>
                <option value="Driver">Driver</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className={inputContainer}>
              <label className={labelClass}>Contact Number</label>
              <input type="tel" placeholder="+27 ..." className={inputClass} 
                value={formData.contact} onChange={e => handleChange('contact', e.target.value)} />
            </div>

            <div className={inputContainer + " md:col-span-2"}>
              <label className={labelClass}>Email Address</label>
              <input type="email" placeholder="john@example.com" required className={inputClass} 
                value={formData.email} onChange={e => handleChange('email', e.target.value)} />
            </div>

            <div className={inputContainer + " md:col-span-2"}>
              <label className={labelClass}>Physical Address</label>
              <input type="text" placeholder="Home or Work Address" className={inputClass} 
                value={formData.address} onChange={e => handleChange('address', e.target.value)} />
            </div>

            <div className={inputContainer}>
              <label className={labelClass}>Password</label>
              <input type="password" placeholder="••••••••" required className={inputClass} 
                value={formData.password} onChange={e => handleChange('password', e.target.value)} />
            </div>

            <div className={inputContainer}>
              <label className={labelClass}>Confirm Password</label>
              <input type="password" placeholder="••••••••" required className={inputClass} 
                value={formData.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} />
            </div>

            <div className="md:col-span-2 pt-6">
              <button type="submit" className="w-full bg-white text-black hover:bg-green-500 hover:text-white transition-all font-black py-4 rounded-2xl shadow-xl active:scale-[0.98]">
                SIGN UP ACCOUNT
              </button>
              
              <div className="mt-8 text-center">
                <p className="text-gray-500 text-xs">
                  Already have an account? {' '}
                  <Link to="/login" className="text-white font-bold hover:text-green-500 underline underline-offset-4 decoration-green-500/30">
                    Log In
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;