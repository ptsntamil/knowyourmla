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
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-2">
        <Share2 size={12} /> Share
      </span>
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-white transition-all transform hover:scale-110 ${link.color}`}
          title={`Share on ${link.name}`}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
};

export default SocialShare;
