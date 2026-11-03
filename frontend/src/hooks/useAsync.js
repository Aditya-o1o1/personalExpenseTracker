import { useCallback, useEffect, useRef, useState } from 'react';

export function useAsync(task, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const result = await task();
      if (currentRequest === requestId.current) setData(result);
    } catch (requestError) {
      if (currentRequest === requestId.current) {
        setError(requestError.message || 'Something went wrong');
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  // task is intentionally supplied by the caller and dependencies define when it should refresh.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, loading, error, reload };
}
