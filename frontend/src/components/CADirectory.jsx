import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, UserCheck, Mail, Hash, Users, AlertCircle } from 'lucide-react';

export default function CADirectory({
  cas,
  clients,
  onFetchCAs,
  isFetchingCAs
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate client assignment count per CA
  const clientCountsByCA = useMemo(() => {
    const map = {};
    for (const c of clients) {
      if (c.ca_id) {
        map[String(c.ca_id)] = (map[String(c.ca_id)] || 0) + 1;
      }
    }
    return map;
  }, [clients]);

  // Filter CAs by search term
  const filteredCAs = useMemo(() => {
    if (!cas || !Array.isArray(cas)) return [];
    return cas.filter(ca => {
      const name = (ca.name || '').toLowerCase();
      const email = (ca.email || '').toLowerCase();
      const id = (ca.id || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      return name.includes(term) || email.includes(term) || id.includes(term);
    });
  }, [cas, searchTerm]);

  return (
    <div className="space-y-3 w-full">
      {/* Header and Filter */}
      <div className="bg-[#141416] p-3 rounded-2xl border border-white/[0.08] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search CAs by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#1c1c1e] text-[#f5f5f7] placeholder-[#86868b] border border-white/10 rounded-xl focus:outline-none focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff] transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#86868b]">
            Total CAs: <strong className="text-[#f5f5f7] font-semibold">{cas?.length || 0}</strong>
          </span>
          <button
            onClick={onFetchCAs}
            disabled={isFetchingCAs}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-[#0a84ff] hover:bg-[#0071e3] active:bg-[#005bb5] rounded-xl shadow-sm shadow-[#0a84ff]/30 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingCAs ? 'animate-spin' : ''}`} />
            {isFetchingCAs ? 'Refreshing...' : 'Refresh from API'}
          </button>
        </div>
      </div>

      {/* CAs Table: No Horizontal Scroll, Fixed Width Proportions */}
      <div className="bg-[#141416] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden w-full">
        <table className="w-full table-fixed text-left text-xs divide-y divide-white/[0.06]">
          <thead className="bg-[#0f0f11] text-[#86868b] font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th scope="col" className="px-4 py-3 w-[30%]">CA Name</th>
              <th scope="col" className="px-4 py-3 w-[30%]">Email</th>
              <th scope="col" className="px-4 py-3 w-[22%]">CA ID</th>
              <th scope="col" className="px-4 py-3 w-[18%] text-right">Assigned Clients</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredCAs.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-[#86868b]">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <AlertCircle className="w-8 h-8 text-[#636366] mb-2" />
                    <p className="font-medium text-[#f5f5f7]">No CAs available</p>
                    <p className="text-xs text-[#86868b] mt-1">
                      {cas && cas.length > 0
                        ? 'No Chartered Accountants match your search filter.'
                        : 'Click "Fetch CAs" to load the list from the external API.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCAs.map((ca) => {
                const assignedCount = clientCountsByCA[String(ca.id)] || 0;
                return (
                  <tr key={ca.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 truncate">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-full bg-[#0a84ff]/15 text-[#0a84ff] flex items-center justify-center font-semibold text-xs border border-[#0a84ff]/25 shrink-0">
                          {(ca.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-[#f5f5f7] truncate text-xs" title={ca.name}>
                          {ca.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 truncate">
                      {ca.email ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#a1a1a6] truncate" title={ca.email}>
                          <Mail className="w-3.5 h-3.5 text-[#86868b] shrink-0" />
                          <span className="truncate">{ca.email}</span>
                        </span>
                      ) : (
                        <span className="text-[#636366] text-xs italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 truncate">
                      <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-md bg-white/[0.06] text-[#e5e5ea] border border-white/[0.08] truncate" title={ca.id}>
                        <Hash className="w-3 h-3 text-[#86868b] shrink-0" />
                        <span className="truncate">{ca.id}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 truncate text-right">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        assignedCount > 0
                          ? 'bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/25'
                          : 'bg-white/[0.06] text-[#86868b]'
                      }`}>
                        <Users className="w-3 h-3" />
                        {assignedCount} {assignedCount === 1 ? 'client' : 'clients'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
