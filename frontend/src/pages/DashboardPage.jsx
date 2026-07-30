import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiArrowUpRight, FiArrowDownLeft, FiSend, 
  FiLogOut, FiDollarSign, FiTrendingUp, FiAlertTriangle, 
  FiX, FiCheckCircle, FiBookOpen, FiUser
} from 'react-icons/fi';
import { useAuthStore } from '../store/useAuthStore';
import api from '../hooks/api';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal controllers
  const [activeModal, setActiveModal] = useState(null); // 'deposit' | 'withdraw' | 'transfer' | 'openAccount'
  const [flaggedTx, setFlaggedTx] = useState(null); // Holds transaction details when flagged
  const [otpCode, setOtpCode] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [confirmSuccess, setConfirmSuccess] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (err) {
      setError('Failed to retrieve account records.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAccount = async (type) => {
    try {
      setError('');
      await api.post('/accounts', { type });
      fetchAccounts();
      setActiveModal(null);
    } catch (err) {
      setError(err.response?.data || 'Failed to open account.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Callback to execute after a successful completed transaction
  const handleTxSuccess = () => {
    fetchAccounts();
    setActiveModal(null);
  };

  // Callback to execute when a transaction gets FLAGGED by security
  const handleTxFlagged = (txData) => {
    setFlaggedTx(txData);
    setActiveModal(null); // Close working modals
  };

  const handleConfirmFlagged = async (e) => {
    e.preventDefault();
    setConfirmError('');
    setConfirmSuccess('');
    setIsConfirming(true);

    try {
      const response = await api.post(`/transactions/${flaggedTx.id}/confirm`, { code: otpCode });
      setConfirmSuccess('Transaction verified and completed successfully!');
      setTimeout(() => {
        setFlaggedTx(null);
        setOtpCode('');
        setConfirmSuccess('');
        fetchAccounts();
      }, 2500);
    } catch (err) {
      setConfirmError(err.response?.data || 'Verification failed. Transaction rejected.');
      setTimeout(() => {
        setFlaggedTx(null);
        setOtpCode('');
        setConfirmError('');
        fetchAccounts();
      }, 3000);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* 1. BRAND NAVBAR */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <FiTrendingUp size={22} />
          </div>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            VaultBank
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400">
            <FiUser size={14} className="text-emerald-400" />
            <span>Client: <strong className="text-white">{user?.name}</strong></span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-rose-400 text-sm font-semibold transition-all duration-200 cursor-pointer"
          >
            <FiLogOut size={16} /> <span className="hidden sm:inline">Secure Logout</span>
          </motion.button>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        
        {/* 2. WELCOME HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Welcome, {user?.name}
            </h1>
            <p className="text-slate-400 text-sm mt-1">Manage, verify, and complete safe financial movements.</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveModal('openAccount')}
              className="px-4 py-2.5 bg-emerald-500 text-slate-950 text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              <FiPlus size={16} /> Open Account
            </motion.button>
          </div>
        </div>

        {/* 3. FLAGGED TRANSACTION INTERCEPT BANNER */}
        <AnimatePresence>
          {flaggedTx && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                <div className="flex gap-4">
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl h-fit border border-amber-500/20">
                    <FiAlertTriangle size={28} className="animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">Security Flag Triggered</h3>
                    <p className="text-slate-400 text-sm max-w-xl">
                      Your requested {flaggedTx.type.toLowerCase()} of{' '}
                      <strong className="text-amber-400">${flaggedTx.amount}</strong> was intercepted by our risk engine due to:{' '}
                      <span className="text-amber-400 font-mono text-xs font-semibold uppercase">
                        {flaggedTx.triggerReasons?.join(', ')}
                      </span>.
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      To complete this safely, please input the simulated verification code: <code className="text-amber-400 font-bold bg-amber-400/5 px-1.5 py-0.5 rounded">123456</code>.
                    </p>
                  </div>
                </div>

                {/* Confirm Form */}
                <form onSubmit={handleConfirmFlagged} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                  <div className="flex flex-col gap-1">
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter Code (123456)"
                      className="px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-xl outline-none text-slate-100 placeholder-slate-600 text-sm transition-all duration-200"
                      required
                    />
                    {confirmError && <span className="text-rose-400 text-xs px-1">{confirmError}</span>}
                    {confirmSuccess && <span className="text-emerald-400 text-xs px-1">{confirmSuccess}</span>}
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      disabled={isConfirming}
                      type="submit"
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      {isConfirming ? (
                        <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Confirm'
                      )}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setFlaggedTx(null)}
                      className="p-2.5 border border-slate-800 hover:border-slate-700 text-slate-400 rounded-xl hover:text-white cursor-pointer"
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. FINANCIAL SUMMARY CARDS */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Your Accounts 
              {loading && <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveModal('deposit')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold border border-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <FiArrowDownLeft size={14} className="text-emerald-400" /> Deposit
              </button>
              <button
                onClick={() => setActiveModal('withdraw')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold border border-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <FiArrowUpRight size={14} className="text-amber-400" /> Withdraw
              </button>
              <button
                onClick={() => setActiveModal('transfer')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold border border-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <FiSend size={14} className="text-blue-400" /> Transfer
              </button>
            </div>
          </div>

          {/* Accounts Grid */}
          {accounts.length === 0 && !loading ? (
            <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
              <p className="text-slate-500 text-sm">No active accounts. Open one to begin your transactions.</p>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {accounts.map((acc, index) => (
                  <motion.div
                    layout
                    key={acc.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/accounts/${acc.id}`)}
                    className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 shadow-xl relative cursor-pointer group overflow-hidden transition-all duration-300"
                  >
                    {/* Glowing effect inside card for premium corporate UI */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:from-emerald-500/10 transition-all duration-300" />

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-slate-950 text-slate-400 rounded-full border border-slate-800 uppercase tracking-wider">
                        {acc.type.toLowerCase()}
                      </span>
                      {acc.type === 'SAVINGS' && (
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10">
                          <FiTrendingUp size={12} /> {acc.interestRatePercent}% APY
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-500 text-xs uppercase font-semibold tracking-wider">Account Number</span>
                      <p className="font-mono text-slate-300 tracking-widest text-sm">{acc.accountNumber.replace(/(.{4})/g, '$1 ')}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 flex items-end justify-between">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Available Balance</span>
                        <p className="text-2xl font-black text-white mt-1">
                          ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl group-hover:text-white group-hover:border-slate-700 transition-all duration-300">
                        <FiBookOpen size={16} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

      </main>

      {/* 5. DYNAMIC INTERACTIVE MODALS */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Body wrapper */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative z-10 overflow-hidden"
            >
              {/* Modal Headers */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white capitalize">
                  {activeModal === 'openAccount' ? 'Open New Account' : `${activeModal} Request`}
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 border border-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* Modal Contents based on type */}
              {activeModal === 'openAccount' && (
                <div className="space-y-4">
                  <p className="text-slate-400 text-sm">Select the standard account structure you wish to configure:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleOpenAccount('CURRENT')}
                      className="p-4 bg-slate-950 hover:bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 cursor-pointer"
                    >
                      <FiDollarSign size={24} className="text-blue-400" />
                      <span className="font-bold text-white text-sm">Current</span>
                      <span className="text-[10px] text-slate-500 text-center">Everyday checking & transfers</span>
                    </button>
                    <button
                      onClick={() => handleOpenAccount('SAVINGS')}
                      className="p-4 bg-slate-950 hover:bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 cursor-pointer"
                    >
                      <FiTrendingUp size={24} className="text-emerald-400" />
                      <span className="font-bold text-white text-sm">Savings</span>
                      <span className="text-[10px] text-slate-500 text-center">Earn competitive interest returns</span>
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'deposit' && (
                <DepositModalContent accounts={accounts} onSuccess={handleTxSuccess} />
              )}

              {activeModal === 'withdraw' && (
                <WithdrawModalContent 
                  accounts={accounts} 
                  onSuccess={handleTxSuccess} 
                  onFlagged={handleTxFlagged} 
                />
              )}

              {activeModal === 'transfer' && (
                <TransferModalContent 
                  accounts={accounts} 
                  onSuccess={handleTxSuccess} 
                  onFlagged={handleTxFlagged} 
                />
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

/* ==========================================
   NESTED MODALS LOGIC WITH INTEGRATIONS
========================================== */

function DepositModalContent({ accounts, onSuccess }) {
  const [accountNumber, setAccountNumber] = useState(accounts[0]?.accountNumber || '');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      await api.post('/transactions/deposit', { accountNumber, amount, notes });
      onSuccess();
    } catch (e) {
      setErr(e.response?.data || 'Execution failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">{err}</div>}
      <div>
        <label className="block text-slate-400 text-xs uppercase font-semibold mb-2">Target Account</label>
        <select
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl outline-none"
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.accountNumber}>
              {acc.type} ({acc.accountNumber.slice(-4)}) — ${acc.balance}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-slate-400 text-xs uppercase font-semibold mb-2">Deposit Amount ($)</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-slate-400 text-xs uppercase font-semibold mb-2">Audit Notes</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Capital insertion"
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl cursor-pointer flex items-center justify-center"
      >
        {loading ? <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : 'Execute Deposit'}
      </button>
    </form>
  );
}

function WithdrawModalContent({ accounts, onSuccess, onFlagged }) {
  const [accountNumber, setAccountNumber] = useState(accounts[0]?.accountNumber || '');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      const response = await api.post('/transactions/withdraw', { accountNumber, amount, notes });
      if (response.data.status === 'FLAGGED') {
        onFlagged(response.data);
      } else {
        onSuccess();
      }
    } catch (e) {
      setErr(e.response?.data || 'Execution failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">{err}</div>}
      <div>
        <label className="block text-slate-400 text-xs uppercase font-semibold mb-2">Source Account</label>
        <select
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl outline-none"
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.accountNumber}>
              {acc.type} ({acc.accountNumber.slice(-4)}) — ${acc.balance}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-slate-400 text-xs uppercase font-semibold mb-2">Amount to Withdraw ($)</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-slate-400 text-xs uppercase font-semibold mb-2">Audit Notes</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ATM withdrawal simulation"
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl cursor-pointer flex items-center justify-center"
      >
        {loading ? <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : 'Execute Withdrawal'}
      </button>
    </form>
  );
}

function TransferModalContent({ accounts, onSuccess, onFlagged }) {
  const [sourceAccountNumber, setSourceAccountNumber] = useState(accounts[0]?.accountNumber || '');
  const [recipientAccountNumber, setRecipientAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      const response = await api.post('/transactions/transfer', { 
        sourceAccountNumber, recipientAccountNumber, amount, notes 
      });
      if (response.data.status === 'FLAGGED') {
        onFlagged(response.data);
      } else {
        onSuccess();
      }
    } catch (e) {
      setErr(e.response?.data || 'Execution failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">{err}</div>}
      <div>
        <label className="block text-slate-400 text-xs uppercase font-semibold mb-2">Debit Source Account</label>
        <select
          value={sourceAccountNumber}
          onChange={(e) => setSourceAccountNumber(e.target.value)}
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl outline-none"
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.accountNumber}>
              {acc.type} ({acc.accountNumber.slice(-4)}) — ${acc.balance}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-slate-400 text-xs uppercase font-semibold mb-2">Recipient 12-Digit Account Number</label>
        <input
          type="text"
          value={recipientAccountNumber}
          onChange={(e) => setRecipientAccountNumber(e.target.value)}
          placeholder="000000000000"
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-slate-400 text-xs uppercase font-semibold mb-2">Transfer Amount ($)</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-slate-400 text-xs uppercase font-semibold mb-2">Audit Notes</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="P2P Transfer"
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl cursor-pointer flex items-center justify-center"
      >
        {loading ? <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : 'Execute Transfer'}
      </button>
    </form>
  );
}