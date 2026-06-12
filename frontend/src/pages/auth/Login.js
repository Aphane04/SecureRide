import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import bgImage from '../../assets/streets.png'; 
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Inside Login.js, update the handleSubmit function:

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const response = await authAPI.login({ email, password });
    const { access_token, user } = response.data;
    login(user, access_token);

    if (user.role === 'Admin') navigate('/dashboard/admin');
    else if (user.role === 'Driver') navigate('/dashboard/driver');
    else navigate('/dashboard/passenger/ride');

  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail || "";

    let errorData = {
      message: "The credentials provided do not match our secure records.",
      type: "incorrect_details"
    };

    // Logic: If user is not found at all (404) or specifically "User not found"
    if (status === 404 || detail.toLowerCase().includes("not found")) {
      errorData = {
        message: "No account is currently registered under this identity.",
        type: "no_account"
      };
    }

    // Redirect to the new error page instead of alerting
    navigate('/auth/error', { state: errorData });

  } finally {
    setLoading(false);
  }
};

  // Professional White Theme Styles
  const inputContainer = "flex flex-col gap-1.5";
  const labelClass = "text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold ml-1";
  const inputClass = "w-full bg-gray-100 border border-gray-200 text-black p-3.5 pl-10 rounded-xl focus:border-[#008751] focus:bg-white outline-none transition-all text-sm placeholder:text-gray-400 font-medium";

  return (
    <div className="flex h-screen bg-white text-black font-sans overflow-hidden">
      
      {/* LEFT SIDE: Identity Panel (35% width) */}
      <div className="hidden lg:flex lg:w-[35%] relative flex-col justify-between p-12 overflow-hidden border-r border-gray-100">
        <img 
          src={bgImage} 
          alt="SecureRide" 
          className="absolute inset-0 w-full h-full object-cover brightness-[0.4] grayscale-[20%]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

        <div className="relative z-10 text-white">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-6 h-6 bg-[#008751] rounded flex items-center justify-center shadow-lg">
              <ShieldCheck size={14} className="text-white" />
            </div>
            <span className="font-black text-sm tracking-tighter uppercase">SecureRide</span>
          </div>
          
          <h1 className="text-5xl font-black tracking-tighter leading-[0.95] mb-6">
            Welcome <br /> <span className="text-gray-400">Terminal</span>
          </h1>
          <p className="text-gray-300 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-[200px]">
            Access your secure safety network
          </p>
        </div>

        <div className="relative z-10">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Network: <span className="text-green-500 animate-pulse font-black">Online & Secure</span>
            </p>
        </div>
      </div>

      {/* RIGHT SIDE: White Login Form (65% width) */}
      <div className="w-full lg:w-[65%] bg-white p-8 md:p-16 flex flex-col items-center justify-center overflow-y-auto custom-scrollbar">
        <div className="max-w-sm w-full">
          
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-4xl font-black text-black tracking-tight mb-2 uppercase italic">Sign In</h2>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">Identity Verification Protocol</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className={inputContainer}>
              <label className={labelClass}>Authorized Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-4 text-gray-400" size={18} />
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  className={inputClass} 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div className={inputContainer}>
              <div className="flex justify-between items-center">
                <label className={labelClass}>Access Password</label>
                <span className="text-[9px] text-gray-400 font-bold uppercase hover:text-[#008751] cursor-pointer transition-colors tracking-widest">Forgot?</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-4 text-gray-400" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  className={inputClass} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-black hover:bg-[#008751] text-white transition-all duration-300 font-black py-4 rounded-xl text-xs uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? "AUTHENTICATING..." : "Enter Terminal"}
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>
          </form>

          <div className="mt-16">
            <div className="relative flex items-center justify-center mb-8">
                <div className="absolute w-full h-px bg-gray-100"></div>
                <span className="relative bg-white px-4 text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Access Node 01</span>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              Not part of the network? {' '}
              <Link to="/register" className="text-black font-black hover:text-[#008751] underline underline-offset-8 decoration-[#008751]/20 transition-all ml-1">
                Register Here
              </Link>
            </p>
          </div>

        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #008751; }
      `}</style>
    </div>
  );
};

export default Login;