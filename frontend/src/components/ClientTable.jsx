import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import { Search, Check, RefreshCw, AlertCircle, Mail, Tag, Sparkles } from 'lucide-react';

export default function ClientTable({
  clients,
  cas,
  onAssignCA,
  savingClientId
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'assigned', 'unassigned'
  
  // Track local selection per row: { [clientId]: selectedCAOption }
  const [rowSelections, setRowSelections] = useState({});

  // Prepare React Select options from cached CAs
  const caOptions = useMemo(() => {
    if (!cas || !Array.isArray(cas)) return [];
    return cas.map(ca => ({
      value: String(ca.id),
      label: `${ca.name} ${ca.email ? `(${ca.email})` : ''}`,
      caRecord: ca
    }));
  }, [cas]);

  // Filter clients based on search query and status filter
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const name = (client.full_name || '').toLowerCase();
      const applywizzId = (client.applywizz_id || '').toLowerCase();
      const email = (client.company_email || '').toLowerCase();
      const caName = (client.name || '').toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        name.includes(term) ||
        applywizzId.includes(term) ||
        email.includes(term) ||
        caName.includes(term);

      if (!matchesSearch) return false;

      if (filterStatus === 'assigned') {
        return !!client.ca_id;
      }
      if (filterStatus === 'unassigned') {
        return !client.ca_id;
      }
      return true;
    });
  }, [clients, searchTerm, filterStatus]);

  // Handle dropdown selection change for a specific row
  const handleSelectChange = (clientId, selectedOption) => {
    setRowSelections(prev => ({
      ...prev,
      [clientId]: selectedOption
    }));
  };

  // Handle clicking OK to assign CA
  const handleConfirmAssignment = (client) => {
    const selectedOption = rowSelections[client.client_id];
    if (!selectedOption || !selectedOption.caRecord) return;

    const ca = selectedOption.caRecord;
    onAssignCA(client.client_id, {
      ca_id: ca.id,
      name: ca.name,
      email: ca.email
    });
  };

  // Apple dark mode custom react-select styles
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '34px',
      height: '34px',
      fontSize: '0.8125rem',
      backgroundColor: '#1c1c1e',
      borderRadius: '0.5rem',
      borderColor: state.isFocused ? '#0a84ff' : 'rgba(255, 255, 255, 0.12)',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(10, 132, 255, 0.25)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#0a84ff' : 'rgba(255, 255, 255, 0.22)'
      },
      transition: 'all 0.15s ease'
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 8px',
      height: '34px'
    }),
    input: (provided) => ({
      ...provided,
      margin: 0,
      padding: 0,
      color: '#f5f5f7'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#f5f5f7',
      fontSize: '0.8125rem',
      fontWeight: 500
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#86868b',
      fontSize: '0.8125rem'
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 50,
      borderRadius: '0.625rem',
      backgroundColor: '#1c1c1e',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
      padding: '4px'
    }),
    menuList: (provided) => ({
      ...provided,
      padding: 0,
      maxHeight: '220px'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#0a84ff'
        : state.isFocused
        ? 'rgba(255, 255, 255, 0.08)'
        : 'transparent',
      color: state.isSelected ? '#ffffff' : '#f5f5f7',
      fontSize: '0.8125rem',
      borderRadius: '0.375rem',
      padding: '6px 10px',
      cursor: 'pointer',
      transition: 'background-color 0.1s ease'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    dropdownIndicator: (provided, state) => ({
      ...provided,
      padding: '4px 6px',
      color: state.isFocused ? '#0a84ff' : '#86868b',
      '&:hover': {
        color: '#f5f5f7'
      }
    })
  };

  return (
    <div className="space-y-3 w-full">
      {/* Search & Filter Toolbar */}
      <div className="bg-[#141416] p-3 rounded-2xl border border-white/[0.08] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, ApplyWizz ID, email, CA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#1c1c1e] text-[#f5f5f7] placeholder-[#86868b] border border-white/10 rounded-xl focus:outline-none focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff] transition-all"
          />
        </div>

        {/* Filter pills: Apple segmented control style */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end bg-[#1c1c1e] p-1 rounded-xl border border-white/[0.06]">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              filterStatus === 'all'
                ? 'bg-white/15 text-white shadow-xs font-semibold'
                : 'text-[#86868b] hover:text-[#f5f5f7]'
            }`}
          >
            All ({clients.length})
          </button>
          <button
            onClick={() => setFilterStatus('assigned')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              filterStatus === 'assigned'
                ? 'bg-[#30d158]/20 text-[#30d158] font-semibold border border-[#30d158]/30'
                : 'text-[#86868b] hover:text-[#f5f5f7]'
            }`}
          >
            Assigned ({clients.filter(c => !!c.ca_id).length})
          </button>
          <button
            onClick={() => setFilterStatus('unassigned')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              filterStatus === 'unassigned'
                ? 'bg-[#ffd60a]/20 text-[#ffd60a] font-semibold border border-[#ffd60a]/30'
                : 'text-[#86868b] hover:text-[#f5f5f7]'
            }`}
          >
            Unassigned ({clients.filter(c => !c.ca_id).length})
          </button>
        </div>
      </div>

      {/* Main Table: No Horizontal Scroll, Fixed Width Proportions */}
      <div className="bg-[#141416] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden w-full">
        <table className="w-full table-fixed text-left text-xs divide-y divide-white/[0.06]">
          <thead className="bg-[#0f0f11] text-[#86868b] font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th scope="col" className="px-4 py-3 w-[24%]">Client Name</th>
              <th scope="col" className="px-3 py-3 w-[15%]">ApplyWizz ID</th>
              <th scope="col" className="px-4 py-3 w-[23%]">Company Email</th>
              <th scope="col" className="px-4 py-3 w-[18%]">Assigned CA</th>
              <th scope="col" className="px-4 py-3 w-[20%]">Select CA & Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-[#86868b]">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <AlertCircle className="w-8 h-8 text-[#636366] mb-2" />
                    <p className="font-medium text-[#f5f5f7]">No matching clients found</p>
                    <p className="text-xs text-[#86868b] mt-1">
                      Try adjusting your search query or filter.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => {
                const isSavingThis = savingClientId === client.client_id;
                
                // Currently selected option in the row dropdown
                const selectedOption = rowSelections[client.client_id] !== undefined
                  ? rowSelections[client.client_id]
                  : client.ca_id
                  ? caOptions.find(opt => opt.value === String(client.ca_id)) || null
                  : null;

                // OK button disabled if same as current or no selection or saving
                const hasSelection = !!selectedOption;
                const isSameAsCurrent = selectedOption && String(selectedOption.value) === String(client.ca_id);
                const isOkDisabled = isSavingThis || !hasSelection || isSameAsCurrent;

                return (
                  <tr
                    key={client.client_id}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Client Name (NO client id) */}
                    <td className="px-4 py-3 truncate">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-full bg-white/[0.08] text-[#f5f5f7] flex items-center justify-center font-semibold text-xs border border-white/10 shrink-0">
                          {(client.full_name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <span
                          className="font-semibold text-[#f5f5f7] truncate text-xs"
                          title={client.full_name || 'No Name'}
                        >
                          {client.full_name || <span className="text-[#636366] italic">No Name</span>}
                        </span>
                      </div>
                    </td>

                    {/* ApplyWizz ID */}
                    <td className="px-3 py-3 truncate">
                      {client.applywizz_id ? (
                        <span
                          className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-md bg-white/[0.06] text-[#e5e5ea] border border-white/[0.08] font-medium truncate"
                          title={client.applywizz_id}
                        >
                          <Tag className="w-3 h-3 text-[#86868b] shrink-0" />
                          <span className="truncate">{client.applywizz_id}</span>
                        </span>
                      ) : (
                        <span className="text-[#636366] text-xs italic">—</span>
                      )}
                    </td>

                    {/* Company Email */}
                    <td className="px-4 py-3 truncate">
                      {client.company_email ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-xs text-[#a1a1a6] truncate hover:text-[#f5f5f7] transition-colors"
                          title={client.company_email}
                        >
                          <Mail className="w-3.5 h-3.5 text-[#86868b] shrink-0" />
                          <span className="truncate">{client.company_email}</span>
                        </span>
                      ) : (
                        <span className="text-[#636366] text-xs italic">—</span>
                      )}
                    </td>

                    {/* Assigned CA */}
                    <td className="px-4 py-3 truncate">
                      {client.name ? (
                        <div className="flex flex-col truncate" title={`${client.name} (${client.email || ''})`}>
                          <span className="inline-flex items-center gap-1.5 font-medium text-[#f5f5f7] truncate">
                            <span className="w-2 h-2 rounded-full bg-[#30d158] shadow-[0_0_6px_rgba(48,209,88,0.5)] shrink-0"></span>
                            <span className="truncate">{client.name}</span>
                          </span>
                          {client.email && (
                            <span className="text-[11px] text-[#86868b] ml-3.5 truncate">
                              {client.email}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#ffd60a]/10 text-[#ffd60a] border border-[#ffd60a]/20">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Action: Select CA & OK button */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex-1 min-w-0">
                          <Select
                            value={selectedOption}
                            onChange={(option) => handleSelectChange(client.client_id, option)}
                            options={caOptions}
                            isSearchable
                            isClearable={false}
                            isDisabled={isSavingThis}
                            placeholder={
                              caOptions.length === 0
                                ? 'Click Fetch CAs'
                                : 'Select CA...'
                            }
                            styles={customSelectStyles}
                            noOptionsMessage={() =>
                              caOptions.length === 0
                                ? 'Click "Fetch CAs" above'
                                : 'No matching CAs'
                            }
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmAssignment(client)}
                          disabled={isOkDisabled}
                          className={`inline-flex items-center justify-center gap-1 px-2.5 h-[34px] rounded-lg text-xs font-semibold shrink-0 transition-all ${
                            isOkDisabled
                              ? 'bg-[#242426] text-[#636366] border border-white/[0.04] cursor-not-allowed'
                              : 'bg-[#0a84ff] hover:bg-[#0071e3] active:bg-[#005bb5] text-white shadow-md shadow-[#0a84ff]/25'
                          }`}
                          title={
                            isSavingThis
                              ? 'Saving assignment...'
                              : isSameAsCurrent
                              ? 'This CA is already assigned'
                              : !hasSelection
                              ? 'Please select a CA first'
                              : 'Confirm assignment'
                          }
                        >
                          {isSavingThis ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>OK</span>
                            </>
                          )}
                        </button>
                      </div>
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
