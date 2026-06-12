import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { AlertOctagon, ArrowRight, UserPlus, RefreshCw, ShieldAlert } from 'lucide-react';

const AuthError = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get error details from the login page redirect
  const { message, type } = location.state || { 
    message: "An unexpected authentication error occurred.", 
    type: "general" 
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans text-black">
      <div className="max-w-md w-full text-center">
        
        {/* Security Icon */}
        <div className="mb-8 flex justify-center">
          <div className="p-5 bg-red-50 rounded-full border-2 border-red-100 text-red-600 animate-pulse">
            <AlertOctagon size={48} />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-4">
          Access Denied
        </h1>
        <p className="text-gray-500 font-medium mb-10 leading-relaxed">
          {message}
        </p>

        {/* Dynamic Redirection Logic */}
        <div className="space-y-4">
          {type === "no_account" ? (
            <div className="flex flex-col gap-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">New to the network?</p>
              <Link 
                to="/register" 
                className="flex items-center justify-center gap-3 w-full bg-black text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#008751] transition-all shadow-xl active:scale-95"
              >
                <UserPlus size={16} /> Create Secure Account
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Retry Protocol</p>
              <Link 
                to="/login" 
                className="flex items-center justify-center gap-3 w-full bg-black text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#008751] transition-all shadow-xl active:scale-95"
              >
                <RefreshCw size={16} /> Return to Login
              </Link>
            </div>
          )}

          {/* Secondary Action */}
          <button 
            onClick={() => navigate('/')}
            className="text-[#008751] font-black text-[10px] uppercase tracking-widest hover:underline mt-8 flex items-center justify-center gap-2 mx-auto"
          >
            Terminal Home <ArrowRight size={12} />
          </button>
        </div>

        {/* Footer Branding */}
        <div className="mt-20 opacity-20 flex items-center justify-center gap-2">
            <ShieldAlert size={14} />
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">SecureRide Security Subsystem</span>
        </div>
      </div>
    </div>
  );
};

export default AuthError;