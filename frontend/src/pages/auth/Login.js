import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mock Login Logic: In a real app, you would verify this via your FastAPI backend
    // and extract the user's role from the JWT token.
    if (email.includes('admin')) {
      navigate('/dashboard/admin');
    } else if (email.includes('driver')) {
      navigate('/dashboard/driver');
    } else {
      navigate('/dashboard/passenger');
    }
  };

  return (
    <div className="min-h-screen bg-[#060b07] flex items-center justify-center p-4">
      {/* Main Container */}
      <div className="max-w-5xl w-full flex bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-900">
        
        {/* Left Side: Brand & Visuals (Hidden on small screens) */}
        <div className="hidden md:flex w-1/2 p-12 flex-col justify-between relative bg-cover bg-center"
             style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?ixlib=rb-4.0.3')" }}>
          
          <div>
            <span className="text-green-500 font-bold text-xl tracking-wider">SECURE RIDE</span>
          </div>

          <div className="mb-10">
            <h1 className="text-4xl font-bold text-white mb-4">Let's Get Started</h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Your safety is our priority. SecureRide ensures every trip is monitored and verified in real-time to keep you protected.
            </p>
          </div>

          <div className="text-xs text-gray-600">
            presented by <span className="text-white font-semibold">SecureRide Tech</span>
          </div>
        </div>
        
        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-12 flex">
          
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-white mb-8">Sign in</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email Input */}
              <div className="relative border-b border-gray-700 focus-within:border-green-500 transition">
                <label className="text-xs text-gray-500 absolute -top-3.5 left-0">Your Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@email.com"
                  className="w-full bg-transparent py-3 text-white focus:outline-none placeholder-gray-700 text-sm" 
                />
              </div>

              {/* Password Input */}
              <div className="relative border-b border-gray-700 focus-within:border-green-500 transition">
                <label className="text-xs text-gray-500 absolute -top-3.5 left-0">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-transparent py-3 text-white focus:outline-none placeholder-gray-700 text-sm" 
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="w-full bg-[#008751] hover:bg-[#007043] text-white py-3.5 rounded-md font-semibold transition mt-8 text-sm"
              >
                Sign in
              </button>
            </form>

            <div className="mt-8 flex justify-between items-center text-xs">
              <div>
                <span className="text-gray-500">Not a member? </span>
                <span 
                  onClick={() => navigate('/register')} 
                  className="text-green-500 cursor-pointer hover:underline font-semibold"
                >
                  Register here
                </span>
              </div>
              <span className="text-gray-600 cursor-pointer hover:text-gray-400 transition">Forgot Password?</span>
            </div>
          </div>

          {/* Social Media Column (Like in your image) */}
          <div className="ml-8 hidden lg:flex flex-col items-center justify-center">
            <div className="h-20 w-px bg-gray-800 mb-4"></div>
            <span className="text-gray-500 text-xs mb-4">OR</span>
            <div className="flex flex-col gap-4">
              
              {/* Facebook */}
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center cursor-pointer hover:bg-gray-200 transition">
                <span className="text-black font-bold text-sm">f</span>
              </div>
              
              {/* Twitter/X */}
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center cursor-pointer hover:bg-gray-200 transition">
                <span className="text-black font-bold text-xs">𝕏</span>
              </div>
              
              {/* Google */}
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center cursor-pointer hover:bg-gray-200 transition">
                <span className="text-black font-bold text-sm">G</span>
              </div>

            </div>
            <div className="h-20 w-px bg-gray-800 mt-4"></div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;