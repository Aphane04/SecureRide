import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, LogIn, ShieldAlert, Info } from 'lucide-react';

const RegisterError = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get error details from the redirect state
  const { message } = location.state || { 
    message: "A conflict occurred during the registration process." 
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans text-black">
      <div className="max-w-md w-full text-center">
        
        {/* Profile Conflict Icon */}
        <div className="mb-8 flex justify-center">
          <div className="p-6 bg-green-50 rounded-full border border-green-100 text-[#008751]">
            <UserPlus size={48} />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-4 leading-none text-black">
          Profile Alert
        </h1>
        
        {/* Error Message */}
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-10">
            <p className="text-sm font-bold text-gray-700 leading-relaxed">
                {message}
            </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 px-4">
          
          <div className="flex flex-col gap-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Recommended Action</p>
            <Link 
              to="/login" 
              className="flex items-center justify-center gap-3 w-full bg-black text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#008751] transition-all shadow-xl active:scale-95"
            >
              <LogIn size={16} /> Sign In to Existing Account
            </Link>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Retry Protocol</p>
            <button 
              onClick={() => navigate('/register')}
              className="text-[#008751] font-black text-[11px] uppercase tracking-widest hover:underline flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft size={14} /> Back to Registration
            </button>
          </div>
        </div>

        {/* Help Note */}
        <div className="mt-16 p-4 rounded-xl border border-gray-100 flex items-start gap-3 text-left">
            <Info size={16} className="text-gray-400 shrink-0 mt-0.5" />
            <p className="text-[9px] text-gray-500 font-medium uppercase leading-relaxed tracking-tight">
                If you believe this is an error or your identity has been compromised, please contact the SecureRide Safety Bureau immediately.
            </p>
        </div>

        {/* Bottom Logo */}
        <div className="mt-12 opacity-10 flex items-center justify-center gap-2">
            <ShieldAlert size={14} />
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">SecureRide Registry</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterError;