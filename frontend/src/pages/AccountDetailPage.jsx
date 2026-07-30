import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiArrowLeft, FiArrowUpRight, FiArrowDownLeft, FiSend, 
  FiTrendingUp, FiDollarSign, FiClock, FiAlertCircle, 
  FiCheckCircle, FiXCircle, FiCalendar, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import api from '../hooks/api';

export default function AccountDetailPage() {
  const { accountId } = useParams();
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination states matching Spring Pageable
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchAccountDetails();
  }, [accountId]);

  useEffect(() => {
    fetchTransactionHistory();
  }, [accountId, currentPage]);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/accounts/${accountId}`);
      setAccount(response.data);
    } catch (err) {
      setError(err.response?.data || 'Failed to retrieve account data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      setTxLoading(true);
      const response = await api.get(`/transactions/account/${accountId}?page=${currentPage}&size=${pageSize}`);
      setTransactions(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error('Failed to retrieve history logs.', err);
    } finally {
      setTxLoading(false);
    }
  };

  const formatTimestamp = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper to map type icons
  const getTxTypeConfig = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return {
          icon: <FiArrowDownLeft size={16} />,
          bgColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          label: 'Deposit',
          sign: '+'
        };
      case 'WITHDRAW':
        return {
          icon: <FiArrowUpRight size={16} />,
          bgColor: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          label: 'Withdrawal',
          sign: '-'
        };
      case 'TRANSFER':
        return {
          icon: <FiSend size={16} />,
          bgColor: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
          label: 'Transfer',
          sign: '-'
        };
      case 'INTEREST':
        return {
          icon: <FiTrendingUp size={16} />,
          bgColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          label: 'Interest Accrual',
          sign: '+'
        };
      default:
        return {
          icon: <FiDollarSign size={16} />,
          bgColor: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
          label: 'Other',
          sign: ''
        };
    }
  };

  // Helper to map status tags
  const getStatusTag = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
            <FiCheckCircle size={12} /> Success
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full">
            <FiClock size={12} /> Pending
          </span>
        );
      case 'FLAGGED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full animate-pulse">
            <FiAlertCircle size={12} /> Flagged
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full">
            <FiXCircle size={12} /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wide">Retrieving account metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6">
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl mb-4">
          <FiAlertCircle size={32} />
        </div>
        <p className="text-white font-bold text-lg mb-2">Access Denied</p>
        <p className="text-slate-400 text-sm text-center max-w-sm mb-6">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm font-bold text-white flex items-center gap-2 cursor-pointer"
        >
          <FiArrowLeft size={16} /> Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* HEADER NAVBAR */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center gap-4 sticky top-0 z-40">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
        >
          <FiArrowLeft size={18} />
        </button>
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Client Portal</span>
          <h2 className="text-lg font-bold text-white mt-0.5">Account Ledger</h2>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        
        {/* 1. ACCOUNT METRIC SUMMARY CARD */}
        {account && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Design Ambient background details */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none" />

            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-3 py-1 bg-slate-950 text-slate-400 rounded-full border border-slate-800 uppercase tracking-wider">
                  {account.type.toLowerCase()} account
                </span>
                {account.type === 'SAVINGS' && (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/10">
                    {account.interestRatePercent}% Annual Percentage Yield (APY)
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Account Number</span>
                <p className="font-mono text-xl text-slate-300 tracking-widest">
                  {account.accountNumber.replace(/(.{4})/g, '$1 ')}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FiCalendar className="text-emerald-500" />
                <span>Opened on: {new Date(account.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            <div className="flex flex-col justify-end p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl relative z-10">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">Available Capital</span>
              <p className="text-3xl font-black text-white mt-1.5">
                ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </motion.div>
        )}

        {/* 2. TRANSACTIONS LEDGER BLOCK */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            History Ledger
            {txLoading && <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
          </h3>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {transactions.length === 0 && !txLoading ? (
              <div className="text-center py-20 text-slate-500 text-sm">
                No recorded financial movements found on this ledger.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-900/40 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                      <th className="py-4 px-6">Transaction Type</th>
                      <th className="py-4 px-6">Details / Notes</th>
                      <th className="py-4 px-6">Date & Time</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {transactions.map((tx, index) => {
                        const config = getTxTypeConfig(tx.type);
                        const isCredit = config.sign === '+';

                        return (
                          <motion.tr
                            key={tx.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            className="border-b border-slate-800/50 hover:bg-slate-900/20 transition-all"
                          >
                            {/* Type */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 border rounded-xl ${config.bgColor}`}>
                                  {config.icon}
                                </div>
                                <span className="font-bold text-white text-sm">
                                  {config.label}
                                </span>
                              </div>
                            </td>

                            {/* Details/Notes */}
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="text-slate-300 text-sm font-semibold">
                                  {tx.notes || 'Internal adjustment'}
                                </span>
                                {tx.type === 'TRANSFER' && (
                                  <span className="text-slate-500 text-xs mt-0.5">
                                    {tx.sourceAccountNumber === account.accountNumber 
                                      ? `To: ${tx.recipientAccountNumber}` 
                                      : `From: ${tx.sourceAccountNumber}`}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Timestamp */}
                            <td className="py-4 px-6 text-slate-400 text-sm">
                              {formatTimestamp(tx.timestamp)}
                            </td>

                            {/* Status */}
                            <td className="py-4 px-6">
                              {getStatusTag(tx.status)}
                            </td>

                            {/* Amount */}
                            <td className={`py-4 px-6 text-right font-mono font-bold text-sm ${
                              isCredit ? 'text-emerald-400' : 'text-slate-300'
                            }`}>
                              {config.sign}${tx.amount.toFixed(2)}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. PAGINATION INTERACTION PANEL */}
            {totalPages > 1 && (
              <div className="py-4 px-6 bg-slate-900/40 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-500 text-xs font-semibold">
                  Page <strong className="text-slate-300">{currentPage + 1}</strong> of <strong className="text-slate-300">{totalPages}</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>

    </div>
  );
}