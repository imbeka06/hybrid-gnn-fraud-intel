import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE from '../lib/api';

const SampleDataContext = createContext();

export function SampleDataProvider({ children }) {
  const [loadedSample, setLoadedSample] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const refreshSampleStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = await axios.get(`${API_BASE}/api/samples/status`);
      if (response.data?.loaded && response.data?.sample_meta) {
        setLoadedSample(response.data.sample_meta);
      } else {
        setLoadedSample(null);
      }
    } catch (err) {
      console.error('Could not refresh sample status:', err);
      setLoadedSample(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  const clearLoadedSample = async () => {
    try {
      await axios.post(`${API_BASE}/api/samples/clear`);
    } catch (err) {
      console.error('Could not clear sample cache:', err);
    } finally {
      setLoadedSample(null);
    }
  };

  useEffect(() => {
    refreshSampleStatus();
  }, []);

  return (
    <SampleDataContext.Provider
      value={{
        loadedSample,
        setLoadedSample,
        refreshSampleStatus,
        clearLoadedSample,
        checkingStatus,
      }}
    >
      {children}
    </SampleDataContext.Provider>
  );
}

export function useSampleData() {
  return useContext(SampleDataContext);
}
