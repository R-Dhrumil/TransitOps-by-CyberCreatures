import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/apiClient.js';

/**
 * useApi — generic data fetching hook.
 * Returns { data, loading, error, refetch }.
 */
const useApi = (url, params = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(url, { params });
      setData(res.data.data);
    } catch (err) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
};

export default useApi;
