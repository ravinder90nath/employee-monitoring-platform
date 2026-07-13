import { useState, useEffect, useCallback } from 'react';

const useFetch = (fn, deps = []) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fn();
      setData(r.data?.data ?? r.data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally { setLoading(false); }
  }, deps);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, refetch: load };
};

export default useFetch;
