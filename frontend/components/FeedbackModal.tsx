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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border-subtle overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-bg-surface">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-text-primary uppercase">
              Submit <span className="text-text-accent">Feedback</span>
            </h2>
            <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">
              Help us improve KnowYourMLA
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-bg-surface rounded-full transition-colors text-text-muted hover:text-text-primary"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 animate-in zoom-in-90 duration-300">
              <CheckCircle2 size={64} className="text-text-primary" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-primary">Thank You!</h3>
                <p className="text-text-muted">Your feedback has been submitted successfully.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="feedback-message" className="block text-sm font-black text-text-primary uppercase tracking-wider">
                  Your Message
                </label>
                <textarea
                  id="feedback-message"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind... (data corrections, feature requests, etc.)"
                  className="w-full h-40 p-4 rounded-2xl bg-bg-surface border-2 border-border-subtle focus:border-text-accent outline-none transition-colors resize-none text-text-primary"
                  disabled={isSubmitting}
                />
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-3 p-4 bg-bg-surface text-text-primary rounded-xl border border-border-subtle animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <p className="text-sm font-medium">{errorMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="w-full py-4 bg-bg-accent hover:bg-bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-text-inverse rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-bg-accent/20"
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
        <div className="px-8 py-4 bg-bg-surface border-t border-border-subtle">
          <p className="text-[10px] text-text-muted font-medium text-center leading-relaxed">
            By submitting feedback, you agree to our terms. We automatically include the current page URL to help us understand the context of your feedback.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
