import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiTrendingUp, FiEdit2, FiSave, FiX, FiLogOut, 
  FiCalendar, FiArrowLeft, FiAlertCircle, FiCheckCircle 
} from 'react-icons/fi';
import { useAuthStore } from '../store/useAuthStore';
import api from '../hooks/api';

export default function AdminInterestRatesPage() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state controllers
  const [editingId, setEditingId] = useState(null);
  const [editPercent, setEditPercent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/interest-rates');
      setRates(response.data);
    } catch (err) {
      setError('Failed to fetch global interest rate parameters.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (rate) => {
    setEditingId(rate.id);
    setEditPercent(rate.ratePercent.toString());
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPercent('');
    setError('');
  };

  const handleSaveRate = async (id) => {
    setError('');
    setSuccessMsg('');

    // Pre-validation matching standard bean validation parameters
    const parsedPercent = parseFloat(editPercent);
    if (isNaN(parsedPercent) || parsedPercent < 0 || parsedPercent > 25.0) {
      setError('Interest rate must be a valid number between 0.00% and 25.00%.');
      return;
    }

    try {
      setSubmitting(true);
      await api.put(`/admin/interest-rates/${id}`, { ratePercent: parsedPercent });
      setSuccessMsg('Global interest policy updated successfully!');
      setEditingId(null);
      setEditPercent('');
      fetchRates(); // Re-fetch the fresh data state

      // Clear success banner after delay
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data || 'Failed to update interest rate.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTimestamp = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wide">Retrieving admin system configuration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* ADMIN NAVBAR */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <FiTrendingUp size={22} />
          </div>
          <div>
            <span className="text-xs font-black tracking-widest text-emerald-500 uppercase">Admin Operations</span>
            <h1 className="text-sm font-bold text-white leading-none mt-0.5">VaultBank Console</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-xs text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
            Role: <strong className="text-emerald-400">System Admin</strong>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-rose-400 text-sm font-semibold transition-all duration-200 cursor-pointer"
          >
            <FiLogOut size={16} /> Logout
          </motion.button>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-8">
        
        {/* HEADER BLOCK */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Interest Management
            </h2>
            <p className="text-slate-400 text-sm mt-1">Configure APY yield percentages across product tiers globally.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-sm font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <FiArrowLeft size={16} /> User Portal View
          </button>
        </div>

        {/* FEEDBACK BANNERS */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl flex items-center gap-2"
            >
              <FiAlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2"
            >
              <FiCheckCircle size={18} />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* POLICY SETTINGS CARD TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="py-4 px-6 bg-slate-900 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Interest Rate Policies</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/40 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                  <th className="py-4 px-6">Account Type</th>
                  <th className="py-4 px-6">Interest Percentage (APY)</th>
                  <th className="py-4 px-6">Last Updated / Effective From</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => {
                  const isEditing = editingId === rate.id;

                  return (
                    <tr
                      key={rate.id}
                      className="border-b border-slate-800/50 hover:bg-slate-900/10 transition-colors"
                    >
                      {/* Product Name */}
                      <td className="py-5 px-6 font-bold text-white text-sm capitalize">
                        {rate.accountType.toLowerCase()} Accounts
                      </td>

                      {/* APY Percentage */}
                      <td className="py-5 px-6">
                        {isEditing ? (
                          <div className="flex items-center gap-2 w-32">
                            <input
                              type="number"
                              step="0.01"
                              value={editPercent}
                              onChange={(e) => setEditPercent(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-lg text-slate-200 font-semibold outline-none text-sm transition-all"
                              required
                            />
                            <span className="text-slate-400 font-bold">%</span>
                          </div>
                        ) : (
                          <span className="font-mono font-black text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1 rounded-md text-sm">
                            {rate.ratePercent}%
                          </span>
                        )}
                      </td>

                      {/* Effective Date */}
                      <td className="py-5 px-6 text-slate-400 text-sm">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="text-slate-500" />
                          <span>{formatTimestamp(rate.effectiveFrom)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-5 px-6 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSaveRate(rate.id)}
                              disabled={submitting}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow shadow-emerald-500/10 disabled:opacity-50 transition-all duration-200"
                            >
                              {submitting ? (
                                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <FiSave size={14} /> Save
                                </>
                              )}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all duration-200"
                            >
                              <FiX size={14} /> Cancel
                            </motion.button>
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleStartEdit(rate)}
                            className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all duration-200 inline-flex"
                          >
                            <FiEdit2 size={13} /> Adjust Rate
                          </motion.button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>

    </div>
  );
}