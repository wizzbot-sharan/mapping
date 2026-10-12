import React from 'react';
import { Users, UserCheck, RefreshCw, Database, Clock, Sparkles } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  onSyncClients,
  isSyncingClients,
  onFetchCAs,
  isFetchingCAs,
  cacheInfo,
  clientCount,
  assignedCount
}) {
  return (
    <header className="bg-[#000000]/80 backdrop-blur-xl border-b border-white/[0.08] sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3">
          
          {/* Brand & Stats */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0a84ff] to-[#5e5ce6] flex items-center justify-center text-white shadow-lg shadow-[#0a84ff]/25 border border-white/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#f5f5f7] tracking-tight">
                  Client–CA Mapping
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.08] text-[#a1a1a6] border border-white/10">
                  Azure Postgres
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#86868b] mt-0.5">
                <span>Total: <strong className="text-[#f5f5f7] font-semibold">{clientCount}</strong></span>
                <span>•</span>
                <span>Assigned: <strong className="text-[#30d158] font-semibold">{assignedCount}</strong></span>
                <span>•</span>
                <span>Unassigned: <strong className="text-[#ffd60a] font-semibold">{clientCount - assignedCount}</strong></span>
              </div>
            </div>
          </div>

          {/* Controls & Cache Info */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Cache Status Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#1c1c1e] text-[#a1a1a6] border border-white/[0.08]">
              <Clock className="w-3.5 h-3.5 text-[#86868b]" />
              {cacheInfo?.isValid ? (
                <span>
                  <strong className="text-[#f5f5f7]">{cacheInfo.count} CAs</strong> cached ({cacheInfo.timeRemainingStr} left)
                </span>
              ) : (
                <span className="text-[#ffd60a] font-medium">
                  No CAs cached (click Fetch CAs)
                </span>
              )}
            </div>

            {/* Sync Clients Button */}
            <button
              onClick={onSyncClients}
              disabled={isSyncingClients}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-[#f5f5f7] bg-[#1c1c1e] hover:bg-[#2c2c2e] active:bg-[#3a3a3c] border border-white/10 rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Synchronize records from clients_additional_info table"
            >
              <Database className={`w-3.5 h-3.5 text-[#0a84ff] ${isSyncingClients ? 'animate-spin' : ''}`} />
              {isSyncingClients ? 'Syncing...' : 'Sync Clients'}
            </button>

            {/* Fetch/Refresh CAs Button */}
            <button
              onClick={onFetchCAs}
              disabled={isFetchingCAs}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-[#0a84ff] hover:bg-[#0071e3] active:bg-[#005bb5] rounded-xl shadow-sm shadow-[#0a84ff]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Fetch latest Chartered Accountants from external API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingCAs ? 'animate-spin' : ''}`} />
              {isFetchingCAs ? 'Fetching CAs...' : 'Fetch CAs'}
            </button>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex border-t border-white/[0.06]">
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'clients'
                ? 'border-[#0a84ff] text-[#0a84ff]'
                : 'border-transparent text-[#86868b] hover:text-[#f5f5f7]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Clients ({clientCount})
          </button>
          <button
            onClick={() => setActiveTab('cas')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'cas'
                ? 'border-[#0a84ff] text-[#0a84ff]'
                : 'border-transparent text-[#86868b] hover:text-[#f5f5f7]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            CAs Directory ({cacheInfo?.count || 0})
          </button>
        </div>
      </div>
    </header>
  );
}
