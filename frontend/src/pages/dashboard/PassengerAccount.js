import React, { useEffect, useState } from 'react';
import { authAPI } from '../../utils/api';

const PassengerAccount = () => {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    dob: '',
    gender: '',
    id_number: '',
    email: '',
  });

  useEffect(() => {
    authAPI.getProfile().then((res) => {
      setForm(res.data);
    });
  }, []);

  const update = async (e) => {
    e.preventDefault();
    await authAPI.updateProfile({
      full_name: form.full_name,
      phone: form.phone,
      address: form.address,
      dob: form.dob,
      gender: form.gender,
      id_number: form.id_number,
      email: form.email,
    });
    alert('Profile updated');
  };

  return (
    <div className="p-8 text-white">
      <h2 className="text-2xl font-bold mb-6">Account Settings</h2>

      <form onSubmit={update} className="bg-[#121212] p-6 rounded-xl space-y-4 max-w-xl">
        <input className="w-full bg-black p-3 rounded border border-gray-800" placeholder="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <input className="w-full bg-black p-3 rounded border border-gray-800" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="w-full bg-black p-3 rounded border border-gray-800" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="w-full bg-black p-3 rounded border border-gray-800" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input type="date" className="w-full bg-black p-3 rounded border border-gray-800" value={form.dob || ''} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
        <input className="w-full bg-black p-3 rounded border border-gray-800" placeholder="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
        <input className="w-full bg-black p-3 rounded border border-gray-800" placeholder="ID Number" value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} />

        <button className="bg-green-600 px-5 py-2 rounded font-bold">Save Changes</button>
      </form>
    </div>
  );
};

export default PassengerAccount;