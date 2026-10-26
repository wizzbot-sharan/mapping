import React, { useState, useMemo, useEffect } from 'react';
import { Search, Check, X, RefreshCw, UserCheck, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

export default function CAMobileSheet({
  isOpen,
  onClose,
  client,
  cas,
  onAssignCA,
  isSaving
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCA, setSelectedCA] = useState(null);

  // Pre-fill with the client's currently assigned CA whenever sheet opens for a client
  useEffect(() => {
    if (client && cas) {
      const current = cas.find(c => String(c.id) === String(client.ca_id));
      setSelectedCA(current || null);
      setSearchTerm('');
    }
  }, [client, cas, isOpen]);

  // Filter CAs by search query
  const filteredCAs = useMemo(() => {
    if (!cas || !Array.isArray(cas)) return [];
    if (!searchTerm.trim()) return cas;
    const term = searchTerm.toLowerCase();
    return cas.filter(ca =>
      (ca.name || '').toLowerCase().includes(term) ||
      (ca.email || '').toLowerCase().includes(term)
    );
  }, [cas, searchTerm]);

  if (!isOpen || !client) return null;

  const isCurrentSame = selectedCA && String(selectedCA.id) === String(client.ca_id);
  const isAlreadyPermanentWithSameCA = isCurrentSame && (client.assignment_type === 'permanent' || !client.assignment_type);
  const isOkDisabled = isSaving || !selectedCA;

  const handleConfirm = async (assignment_type) => {
    if (!selectedCA) return;
    const ok = await onAssignCA(client.client_id, {
      ca_id: selectedCA.id,
      name: selectedCA.name,
      email: selectedCA.email,
      assignment_type
    });
    // Auto-close sheet on successful save
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Bottom Sheet Container */}
      <div className="relative w-full max-w-lg bg-[#18181b] rounded-t-3xl border-t border-white/15 shadow-2xl flex flex-col max-h-[85vh] animate-slide-up z-10 text-[#f5f5f7]">
        {/* Drag Handle & Header */}
        <div className="p-4 border-b border-white/[0.08] flex flex-col items-center">
          <div className="w-10 h-1 bg-white/20 rounded-full mb-3" />
          
          <div className="w-full flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="text-[11px] text-[#86868b] uppercase tracking-wider font-semibold">
                Assign Chartered Accountant
              </span>
              <h3 className="text-sm font-bold text-[#f5f5f7] truncate">
                {client.full_name || 'Client'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full mt-3">
            <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search CA by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-xs bg-[#242426] text-[#f5f5f7] placeholder-[#86868b] rounded-xl border border-white/10 focus:outline-none focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff] transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Scrollable List of CAs */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-white/[0.04]">
          {filteredCAs.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#86868b]">
              <AlertCircle className="w-7 h-7 mx-auto mb-2 text-[#636366]" />
              <p className="font-medium text-[#f5f5f7]">No matching CAs</p>
              <p className="text-[11px] mt-0.5">
                {cas && cas.length > 0 ? 'Try searching another name' : 'Click "Fetch CAs" in the header to load CAs'}
              </p>
            </div>
          ) : (
            filteredCAs.map((ca) => {
              const isSelected = selectedCA && String(selectedCA.id) === String(ca.id);
              const isCurrentlyAssigned = String(client.ca_id) === String(ca.id);

              return (
                <div
                  key={ca.id}
                  onClick={() => setSelectedCA(ca)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#0a84ff]/20 border border-[#0a84ff]/40 text-white'
                      : 'hover:bg-white/[0.04] text-[#a1a1a6]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs border shrink-0 ${
                      isSelected
                        ? 'bg-[#0a84ff] text-white border-white/20'
                        : 'bg-white/[0.08] text-[#f5f5f7] border-white/10'
                    }`}>
                      {(ca.name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-[#f5f5f7] truncate flex items-center gap-1.5">
                        <span className="truncate">{ca.name}</span>
                        {isCurrentlyAssigned && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/30">
                            Current
                          </span>
                        )}
                      </div>
                      {ca.email && (
                        <div className="text-[11px] text-[#86868b] truncate">
                          {ca.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#0a84ff] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="p-3.5 border-t border-white/[0.08] bg-[#141416] flex flex-col gap-2 rounded-b-3xl">
          <div className="flex items-center gap-2">
            {/* Permanent Button */}
            <button
              type="button"
              onClick={() => handleConfirm('permanent')}
              disabled={isOkDisabled || isAlreadyPermanentWithSameCA}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md ${
                isOkDisabled || isAlreadyPermanentWithSameCA
                  ? 'bg-[#242426] text-[#636366] border border-white/[0.04] cursor-not-allowed shadow-none'
                  : 'bg-[#30d158]/20 hover:bg-[#30d158]/30 active:bg-[#30d158]/40 text-[#30d158] border border-[#30d158]/40 shadow-[#30d158]/15'
              }`}
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>Permanent</span>
            </button>

            {/* Temporary Button */}
            <button
              type="button"
              onClick={() => handleConfirm('temp')}
              disabled={isOkDisabled}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md ${
                isOkDisabled
                  ? 'bg-[#242426] text-[#636366] border border-white/[0.04] cursor-not-allowed shadow-none'
                  : 'bg-[#ff9f0a]/20 hover:bg-[#ff9f0a]/30 active:bg-[#ff9f0a]/40 text-[#ff9f0a] border border-[#ff9f0a]/40 shadow-[#ff9f0a]/15'
              }`}
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              <span>Temp (Today)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-full py-1.5 text-xs font-medium text-[#86868b] hover:text-[#f5f5f7] transition-colors text-center"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
