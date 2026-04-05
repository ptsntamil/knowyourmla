import React from "react";

interface AnswerSnippetProps {
  question: string;
  answer: string;
  className?: string;
}

export default function AnswerSnippet({ question, answer, className = "" }: AnswerSnippetProps) {
  return (
    <div className={`bg-brand-gold/10 border-l-4 border-brand-gold p-6 rounded-r-2xl ${className}`}>
      <h2 className="text-sm font-black text-brand-dark dark:text-brand-gold uppercase tracking-widest mb-2">
        {question}
      </h2>
      <p className="text-lg text-brand-dark dark:text-slate-400 leading-snug">
        {answer}
      </p>
    </div>
  );
}
