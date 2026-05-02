import React, { useEffect, useState } from 'react';
import { contactAPI } from '../../utils/api';

const PassengerContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', relationship_type: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const loadContacts = async () => {
    try {
      const res = await contactAPI.list();
      setContacts(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load contacts.');
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await contactAPI.update(editingId, form);
        setEditingId(null);
      } else {
        await contactAPI.create(form);
      }
      setForm({ name: '', phone: '', relationship_type: '' });
      loadContacts();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to save contact.');
    }
  };

  const startEdit = (contact) => {
    setEditingId(contact.id);
    setForm({ name: contact.name, phone: contact.phone, relationship_type: contact.relationship_type || '' });
  };

  const remove = async (id) => {
    try {
      await contactAPI.remove(id);
      loadContacts();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete contact.');
    }
  };

  return (
    <div className="p-8 text-white">
      <h2 className="text-2xl font-bold mb-6">Emergency Contacts</h2>
      {error && <div className="text-red-400 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-[#121212] p-6 rounded-xl mb-8 space-y-4">
        <input className="w-full bg-black p-3 rounded border border-gray-800" placeholder="Full Name"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="w-full bg-black p-3 rounded border border-gray-800" placeholder="Phone Number"
          value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="w-full bg-black p-3 rounded border border-gray-800" placeholder="Relationship (e.g. Mother, Brother)"
          value={form.relationship_type} onChange={(e) => setForm({ ...form, relationship_type: e.target.value })} />
        <button className="bg-green-600 px-5 py-2 rounded font-bold">
          {editingId ? 'Update Contact' : 'Add Contact'}
        </button>
      </form>

      {contacts.length === 0 ? (
        <div className="text-gray-400">No contacts added yet.</div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c.id} className="bg-black p-4 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold">{c.name}</div>
                <div className="text-gray-400 text-sm">{c.phone}</div>
                {c.relationship_type && <div className="text-xs text-gray-500">{c.relationship_type}</div>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => startEdit(c)} className="text-blue-400 text-sm">Edit</button>
                <button onClick={() => remove(c.id)} className="text-red-400 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PassengerContacts;