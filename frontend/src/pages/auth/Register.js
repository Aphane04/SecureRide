import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import sideImage from '../../assets/download (19).jpg';

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
        alert("Admin account created successfully.");
        navigate('/login');
      } else {
        navigate('/verify/consent', { state: { userId: response.data.id } });
      }
    } catch (error) {
      alert(error.response?.data?.detail || "Registration failed. Please try again.");
    }
  };

  // Helper to update state and handle ID Parsing logic
  const handleChange = (field, value) => {
    let updatedData = { ...formData, [field]: value };

    // ID Parsing Logic (South African ID Format)
    if (field === 'idNumber' && value.length === 13) {
      const idStr = value;
      
      // 1. Extract DOB
      const yy = idStr.substring(0, 2);
      const mm = idStr.substring(2, 4);
      const dd = idStr.substring(4, 6);
      
      // Determine century (if yy > current year, assume 1900s, else 2000s)
      const currentYearShort = new Date().getFullYear() % 100;
      const century = parseInt(yy) <= currentYearShort ? "20" : "19";
      const dobFormatted = `${century}${yy}-${mm}-${dd}`;

      // 2. Extract Gender (Digits 7-10. < 5000 is Female, >= 5000 is Male)
      const genderCode = parseInt(idStr.substring(6, 10));
      const genderFormatted = genderCode < 5000 ? "Female" : "Male";

      updatedData.dob = dobFormatted;
      updatedData.gender = genderFormatted;
    }

    setFormData(updatedData);
  };

  // Styling Classes
  const inputContainer = "flex flex-col gap-1";
  const labelClass = "text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold ml-1";
  const inputClass = "w-full bg-[#0d0d0d] border border-white/5 text-white p-2.5 rounded-lg focus:border-green-500 focus:bg-[#151515] outline-none transition-all text-xs placeholder:text-gray-800 appearance-none";

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* LEFT SIDE: Identity Panel */}
      <div className="hidden lg:flex lg:w-[30%] relative flex-col justify-between p-10 overflow-hidden border-r border-white/5">
        <img 
          src={sideImage} 
          alt="SecureRide" 
          className="absolute inset-0 w-full h-full object-cover brightness-[0.4]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)]">
              <div className="w-2 h-2 bg-white rounded-sm" />
            </div>
            <span className="font-black text-sm tracking-tighter uppercase">SecureRide</span>
          </div>
          
          <h1 className="text-4xl font-black tracking-tighter leading-tight mb-4">
            Get Started <br /> <span className="text-gray-400">with Us</span>
          </h1>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Multi-Step Verification active</p>
        </div>

        <div className="relative z-10 flex flex-col gap-2">
          <div className="bg-white p-4 rounded-2xl w-full text-black shadow-xl border border-white">
            <span className="text-[8px] font-black mb-1 block uppercase">Step 01</span>
            <p className="text-[10px] font-bold leading-tight tracking-tight">Create your secure account</p>
          </div>
          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl w-full text-white/40">
            <span className="text-[8px] font-black mb-1 block uppercase tracking-tighter opacity-50">Next Steps</span>
            <p className="text-[10px] font-bold leading-tight opacity-50">Consent & Biometric Scan</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Registry Form */}
      <div className="w-full lg:w-[70%] bg-black p-6 md:p-12 lg:p-16 flex flex-col items-center overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl w-full">
          <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tight mb-1">Sign Up Account</h2>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Personal Data Entry Terminal</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 text-left">
            
            <div className={inputContainer}>
              <label className={labelClass}>First Name</label>
              <input type="text" placeholder="John" required className={inputClass} 
                value={formData.firstName} onChange={e => handleChange('firstName', e.target.value)} />
            </div>

            <div className={inputContainer}>
              <label className={labelClass}>Surname</label>
              <input type="text" placeholder="Doe" required className={inputClass} 
                value={formData.surname} onChange={e => handleChange('surname', e.target.value)} />
            </div>

            <div className={inputContainer}>
              <label className={labelClass}>ID Number</label>
              <input type="text" placeholder="13-digit National ID" required maxLength={13} className={inputClass} 
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
              <select className={inputClass} value={formData.ethnicity} onChange={e => handleChange('ethnicity', e.target.value)}>
                <option value="">Select Ethnicity</option>
                <option value="African">African</option>
                <option value="Indian">Indian</option>
                <option value="White">White</option>
                <option value="Coloured">Coloured</option>
                <option value="Other">Other</option>
              </select>
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
              <label className={labelClass}>Contact</label>
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
              <input type="text" placeholder="Full Home Address" className={inputClass} 
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

            <div className="md:col-span-2 pt-4">
              <button type="submit" className="w-full bg-white text-black hover:bg-green-600 hover:text-white transition-all font-black py-3 rounded-lg text-xs shadow-xl active:scale-[0.98]">
                REGISTER & CONTINUE
              </button>
              
              <div className="mt-4 text-center">
                <p className="text-gray-600 text-[10px] font-medium">
                  Already have an account? {' '}
                  <Link to="/login" className="text-white font-bold hover:text-green-500 underline underline-offset-4 decoration-green-500/20">
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #22c55e; }
        select { background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 0.7rem center; background-size: 1em; }
      `}</style>
    </div>
  );
};

export default Register;