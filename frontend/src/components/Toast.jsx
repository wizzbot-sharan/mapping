import React from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  const iconColor = isSuccess ? 'text-[#30d158]' : isError ? 'text-[#ff453a]' : 'text-[#0a84ff]';
  const Icon = isSuccess ? CheckCircle2 : isError ? AlertCircle : Info;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-fade-in transition-all duration-300">
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/15 text-[#f5f5f7] shadow-2xl">
        <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
        <div className="flex-1 text-xs font-medium leading-relaxed">
          {toast.message}
        </div>
        <button
          onClick={onClose}
          className="text-[#86868b] hover:text-[#f5f5f7] transition-colors p-1 rounded-lg hover:bg-white/10"
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
