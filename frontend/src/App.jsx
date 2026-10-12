import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import ClientTable from './components/ClientTable';
import CADirectory from './components/CADirectory';
import Toast from './components/Toast';
import { fetchClients, syncClients, fetchCAs, assignCA } from './utils/api';
import { getCachedCAs, setCachedCAs, getCacheStatus } from './utils/caCache';
import { Database, RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' | 'cas'
  const [clients, setClients] = useState([]);
  const [cas, setCas] = useState([]);
  const [cacheInfo, setCacheInfo] = useState(getCacheStatus());

  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSyncingClients, setIsSyncingClients] = useState(false);
  const [isFetchingCAs, setIsFetchingCAs] = useState(false);
  const [savingClientId, setSavingClientId] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // 1. Initial Load: Load existing stored clients and check CA cache
  useEffect(() => {
    const initApp = async () => {
      setIsLoadingInitial(true);

      // Check CA localStorage cache (valid for 8 hours)
      const cached = getCachedCAs();
      if (cached && cached.length > 0) {
        setCas(cached);
      }
      setCacheInfo(getCacheStatus());

      // Fetch currently stored clients in client_ca
      try {
        const res = await fetchClients();
        if (res.success && Array.isArray(res.data)) {
          setClients(res.data);
        }
      } catch (err) {
        console.error('Error fetching initial client mappings:', err);
      } finally {
        setIsLoadingInitial(false);
      }
    };

    initApp();
  }, []);

  // 2. Action: Sync Clients from clients_additional_info
  const handleSyncClients = async () => {
    setIsSyncingClients(true);
    try {
      const res = await syncClients();
      if (res.success && Array.isArray(res.data)) {
        setClients(res.data);
        showToast(res.message || `Successfully synced ${res.syncedCount || res.data.length} clients!`, 'success');
      } else {
        showToast(res.message || 'Failed to sync clients', 'error');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      showToast(err.message || 'Failed to sync clients from database', 'error');
    } finally {
      setIsSyncingClients(false);
    }
  };

  // 3. Action: Fetch CAs from external API and store in 8-hour cache
  const handleFetchCAs = async () => {
    setIsFetchingCAs(true);
    try {
      const res = await fetchCAs();
      if (res.success && Array.isArray(res.data)) {
        setCas(res.data);
        setCachedCAs(res.data);
        setCacheInfo(getCacheStatus());
        showToast(`Loaded and cached ${res.data.length} Chartered Accountants for 8 hours.`, 'success');
      } else {
        showToast(res.message || 'Failed to fetch CAs', 'error');
      }
    } catch (err) {
      console.error('Fetch CAs failed:', err);
      showToast(err.message || 'Failed to fetch CAs from API', 'error');
    } finally {
      setIsFetchingCAs(false);
    }
  };

  // 4. Action: Assign CA to Client
  const handleAssignCA = async (clientId, caData) => {
    setSavingClientId(clientId);
    try {
      const res = await assignCA(clientId, caData);
      if (res.success && res.data) {
        // Update client in local state
        setClients(prev => prev.map(c => (c.client_id === clientId ? { ...c, ...res.data } : c)));
        const clientName = res.data.full_name || 'Client';
        showToast(`Assigned CA ${caData.name} to ${clientName} successfully!`, 'success');
        return true;
      } else {
        showToast(res.message || 'Failed to save CA assignment', 'error');
        return false;
      }
    } catch (err) {
      console.error('Assignment failed:', err);
      showToast(err.message || 'Failed to save CA assignment', 'error');
      return false;
    } finally {
      setSavingClientId(null);
    }
  };

  const assignedCount = clients.filter(c => !!c.ca_id).length;

  return (
    <div className="min-h-screen flex flex-col bg-black text-[#f5f5f7]">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSyncClients={handleSyncClients}
        isSyncingClients={isSyncingClients}
        onFetchCAs={handleFetchCAs}
        isFetchingCAs={isFetchingCAs}
        cacheInfo={cacheInfo}
        clientCount={clients.length}
        assignedCount={assignedCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {isLoadingInitial ? (
          <div className="flex flex-col items-center justify-center py-28 text-[#86868b]">
            <RefreshCw className="w-7 h-7 animate-spin mb-3 text-[#0a84ff]" />
            <p className="text-xs font-medium">Loading Client–CA Dashboard...</p>
          </div>
        ) : activeTab === 'clients' ? (
          <ClientTable
            clients={clients}
            cas={cas}
            onAssignCA={handleAssignCA}
            savingClientId={savingClientId}
          />
        ) : (
          /* CAs Directory tab */
          <CADirectory
            cas={cas}
            clients={clients}
            onFetchCAs={handleFetchCAs}
            isFetchingCAs={isFetchingCAs}
          />
        )}
      </main>

      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
