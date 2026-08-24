"use client";
import React from 'react';
import { Twitter, MessageCircle, Share2 } from 'lucide-react';

interface SocialShareProps {
  url: string;
  title: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ url, title }) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: 'Twitter',
      icon: <Twitter size={18} />,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'hover:bg-[#1DA1F2]',
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={18} />,
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      color: 'hover:bg-[#25D366]',
    },
  ];

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={async () => {
          try {
            if (navigator.share) {
              await navigator.share({
                title: title,
                url: url
              });
            } else {
              await navigator.clipboard.writeText(url);
              alert('Link copied to clipboard!');
            }
          } catch (err) {
            console.error('Error sharing:', err);
          }
        }}
        className="text-[10px] font-black text-slate-400 hover:text-brand-gold uppercase tracking-widest mr-2 flex items-center gap-2 cursor-pointer transition-colors relative z-[9999] pointer-events-auto"
      >
        <Share2 size={12} /> Share
      </button>
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`relative z-[9999] cursor-pointer pointer-events-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-white transition-all transform hover:scale-110 ${link.color}`}
          title={`Share on ${link.name}`}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
};

export default SocialShare;
