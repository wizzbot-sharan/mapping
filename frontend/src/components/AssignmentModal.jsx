import React from 'react';
import { ShieldCheck, Clock, X, RefreshCw, User, Mail, ArrowRight } from 'lucide-react';

export default function AssignmentModal({
  isOpen,
  onClose,
  client,
  selectedCA,
  onConfirm,
  isSaving
}) {
  if (!isOpen || !client || !selectedCA) return null;

  // Compute IST preview text for the user
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const parts = istFormatter.formatToParts(now).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  const currentHour = parseInt(parts.hour, 10);
  const resetDayText = currentHour < 9 ? 'today at 9:00 AM IST' : 'tomorrow at 9:00 AM IST';

  const permanentFallback = client.permanent_name || (client.assignment_type === 'permanent' && client.name) || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={() => !isSaving && onClose()}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-[#18181b] border border-white/15 rounded-3xl shadow-2xl p-6 text-[#f5f5f7] z-10 animate-scale-up space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
              Assignment Duration
            </span>
            <h3 className="text-base font-bold text-[#f5f5f7] mt-0.5">
              Assign CA to {client.full_name || 'Client'}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-full text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected CA Badge */}
        <div className="bg-[#242426] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#0a84ff]/15 text-[#0a84ff] border border-[#0a84ff]/30 flex items-center justify-center font-bold text-sm shrink-0">
              {(selectedCA.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#f5f5f7] truncate">
                {selectedCA.name}
              </p>
              {selectedCA.email && (
                <p className="text-[11px] text-[#86868b] truncate">
                  {selectedCA.email}
                </p>
              )}
            </div>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-[#a1a1a6] shrink-0">
            New Assignee
          </span>
        </div>

        {/* Dual Options */}
        <div className="space-y-3">
          {/* Option 1: Permanent */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onConfirm('permanent')}
            className="w-full text-left p-4 rounded-2xl border border-white/10 bg-[#1f1f23] hover:bg-[#27272b] hover:border-[#30d158]/50 active:bg-[#2a2a2f] transition-all group relative overflow-hidden"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#f5f5f7]">
                    Permanent Assignment
                  </span>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#30d158]/10 text-[#30d158]">
                    Default
                  </span>
                </div>
                <p className="text-[11px] text-[#86868b] mt-1 leading-relaxed">
                  Permanently assigned to this client until manually changed.
                </p>
              </div>
            </div>
          </button>

          {/* Option 2: Temporary (Today only) */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onConfirm('temp')}
            className="w-full text-left p-4 rounded-2xl border border-white/10 bg-[#1f1f23] hover:bg-[#27272b] hover:border-[#ff9f0a]/50 active:bg-[#2a2a2f] transition-all group relative overflow-hidden"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#ff9f0a]/15 text-[#ff9f0a] border border-[#ff9f0a]/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#f5f5f7]">
                    Temporary Assignment
                  </span>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#ff9f0a]/10 text-[#ff9f0a]">
                    Today Only
                  </span>
                </div>
                <p className="text-[11px] text-[#86868b] mt-1 leading-relaxed">
                  Active for today only. Resets {resetDayText} back to{' '}
                  <strong className="text-[#f5f5f7]">
                    {permanentFallback ? permanentFallback : 'Unassigned'}
                  </strong>.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer / Cancel */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-[#86868b] hover:text-[#f5f5f7] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
