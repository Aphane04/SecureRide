import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
// Using the same branding assets
import bgImage from '../../assets/streets.png'; 
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      const { access_token, user } = response.data;

      login(user, access_token);

      // Role-based redirection
      if (user.role === 'Admin') navigate('/dashboard/admin');
      else if (user.role === 'Driver') navigate('/dashboard/driver');
      else navigate('/dashboard/passenger/ride');
    } catch (error) {
      alert(error.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Matching Register Page Styles
  const inputContainer = "flex flex-col gap-1.5";
  const labelClass = "text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold ml-1";
  const inputClass = "w-full bg-[#0d0d0d] border border-white/5 text-white p-3 rounded-xl focus:border-green-500 focus:bg-[#151515] outline-none transition-all text-sm placeholder:text-gray-800";

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* LEFT SIDE: Image Panel (35% width) */}
      <div className="hidden lg:flex lg:w-[35%] relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        <img 
          src={bgImage} 
          alt="SecureRide Streets" 
          className="absolute inset-0 w-full h-full object-cover brightness-[0.5] grayscale-[50%]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)]">
              <ShieldCheck size={14} className="text-white" />
            </div>
            <span className="font-black text-sm tracking-tighter uppercase">SecureRide</span>
          </div>
          
          <h1 className="text-5xl font-black tracking-tighter leading-[0.95] mb-6">
            Welcome <br /> <span className="text-gray-400">USER</span>
          </h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-[200px]">
            Access your secure safety terminal
          </p>
        </div>

        <div className="relative z-10">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                Network Status: <span className="text-green-500 animate-pulse font-black">Encrypted, Secure</span>
            </p>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form (65% width) */}
      <div className="w-full lg:w-[65%] bg-black p-8 md:p-16 flex flex-col items-center justify-center overflow-y-auto custom-scrollbar">
        <div className="max-w-sm w-full">
          
          <div className="mb-10">
            <h2 className="text-3xl font-black tracking-tight mb-2">Sign In Account</h2>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Identity Verification Protocol</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className={inputContainer}>
              <label className={labelClass}>Authorized Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-700" size={16} />
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  className={inputClass + " pl-10"} 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div className={inputContainer}>
              <div className="flex justify-between items-center">
                <label className={labelClass}>Password</label>
                <span className="text-[9px] text-gray-600 font-bold uppercase hover:text-green-500 cursor-pointer transition-colors">Forgot?</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-700" size={16} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  className={inputClass + " pl-10"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white text-black hover:bg-green-600 hover:text-white transition-all font-black py-4 rounded-xl text-xs uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Sign In"}
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>
          </form>

          {/* Social Logins - Styled more professionally */}
          <div className="mt-12">
            <div className="relative flex items-center justify-center mb-8">
                <div className="absolute w-full h-px bg-white/5"></div>
                <span className="relative bg-black px-4 text-[10px] font-black text-gray-700 uppercase tracking-widest">Secondary Access</span>
            </div>

           
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              Do not have an account? {' '}
              <Link to="/register" className="text-white font-black hover:text-green-500 underline underline-offset-8 decoration-green-500/20 transition-all ml-1">
                Register Here
              </Link>
            </p>
          </div>

        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #22c55e; }
      `}</style>
    </div>
  );
};

export default Login;