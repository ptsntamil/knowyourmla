"use client";

import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { submitFeedback } from '@/services/api';

interface PollingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  constituencyName: string;
  constituencySlug: string;
  year: number;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const PollingRequestModal: React.FC<PollingRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  constituencyName,
  year
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setName('');
        setEmail('');
        setNotes('');
        setStatus('idle');
        setErrorMessage('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email.trim() && !EMAIL_REGEX.test(email.trim())) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');

    try {
      const formattedMessage = [
        `Request for polling station data:`,
        `• Constituency: ${constituencyName}`,
        `• Election Year: ${year}`,
        notes.trim() ? `• Additional Details: ${notes.trim()}` : null
      ].filter(Boolean).join('\n');

      const subject = `Polling Station Data Request: ${constituencyName} (${year})`;

      await submitFeedback(
        formattedMessage,
        window.location.href,
        name.trim() || undefined,
        email.trim() || undefined,
        subject
      );

      setStatus('success');
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: unknown) {
      setStatus('error');
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again later.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 id="modal-headline" className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
              <FileText className="w-6 h-6 text-brand-gold inline" />
              Request <span className="text-brand-gold">Polling Data</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
              {constituencyName} • {year} Election
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 animate-in zoom-in-90 duration-300">
              <CheckCircle2 size={64} className="text-brand-green" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Request Received!</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Thank you! We have received your request for <strong>{constituencyName}</strong> ({year}) polling station data.
                  {email.trim() ? " We will notify you once the dataset is published." : " Our team will prioritize sourcing this dataset."}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Booth-level data for this constituency is currently being processed. Let us know your details to prioritize this constituency or receive updates.
              </p>

              <div className="space-y-2">
                <label htmlFor="request-name" className="block text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Name (Optional)
                </label>
                <input
                  id="request-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-brand-gold dark:focus:border-brand-gold focus:ring-0 outline-none transition-colors text-slate-900 dark:text-slate-100"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="request-email" className="block text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Email (Optional)
                </label>
                <input
                  id="request-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-brand-gold dark:focus:border-brand-gold focus:ring-0 outline-none transition-colors text-slate-900 dark:text-slate-100"
                  disabled={isSubmitting}
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Optional: Provide your email if you would like to be notified when data is available.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="request-notes" className="block text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Notes / Specific Booth (Optional)
                </label>
                <textarea
                  id="request-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Looking for Booth 42, or specific ward/panchayat details..."
                  className="w-full h-24 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-brand-gold dark:focus:border-brand-gold focus:ring-0 outline-none transition-colors resize-none text-slate-900 dark:text-slate-100"
                  disabled={isSubmitting}
                />
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <p className="text-sm font-medium">{errorMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || (email.trim().length > 0 && !EMAIL_REGEX.test(email.trim()))}
                className="w-full py-4 bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-brand-green/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium text-center leading-relaxed">
            Your request will be sent to the KnowYourMLA research team. We will include the current page URL to map the constituency correctly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PollingRequestModal;
