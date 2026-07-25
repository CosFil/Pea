import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface ValueCopyBadgeProps {
  value: string;
  label?: string;
  className?: string;
}

export const ValueCopyBadge: React.FC<ValueCopyBadgeProps> = ({ value, label, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      title="Κάντε κλικ για αντιγραφή τιμής στο πρόχειρο"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer border ${
        copied
          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
          : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700'
      } ${className}`}
    >
      {label && <span className="text-slate-500 font-sans font-normal">{label}:</span>}
      <span className="font-semibold">{value}</span>
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />}
    </button>
  );
};
