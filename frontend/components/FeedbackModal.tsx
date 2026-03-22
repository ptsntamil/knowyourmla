"use client";

import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitFeedback } from '@/services/api';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setMessage('');
        setStatus('idle');
        setErrorMessage('');
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setStatus('idle');
    
    try {
      await submitFeedback(message, window.location.href);
      setStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Submit <span className="text-brand-gold">Feedback</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
              Help us improve KnowYourMLA
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Thank You!</h3>
                <p className="text-slate-600 dark:text-slate-400">Your feedback has been submitted successfully.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="feedback-message" className="block text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Your Message
                </label>
                <textarea
                  id="feedback-message"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind... (data corrections, feature requests, etc.)"
                  className="w-full h-40 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-brand-gold dark:focus:border-brand-gold focus:ring-0 outline-none transition-colors resize-none text-slate-900 dark:text-slate-100"
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
                disabled={isSubmitting || !message.trim()}
                className="w-full py-4 bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-brand-green/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Send Feedback
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium text-center leading-relaxed">
            By submitting feedback, you agree to our terms. We automatically include the current page URL to help us understand the context of your feedback.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
