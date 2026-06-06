import { useEffect, useState } from 'react';

export function useMarketData() {
  const [candles, setCandles] = useState([]);
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData(isInitial) {
      if (isInitial) {
        setLoading(true);
      }

      try {
        const [candlesRes, signalRes] = await Promise.all([
          fetch('https://kryptonett-backend.onrender.com/api/candles'),
          fetch('https://kryptonett-backend.onrender.com/api/signal'),
        ]);

        if (!candlesRes.ok || !signalRes.ok) {
          throw new Error('Failed to fetch market data');
        }

        const candlesData = await candlesRes.json();
        const signalData = await signalRes.json();

        if (!cancelled) {
          setCandles(candlesData.candles);
          setSignal(signalData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled && isInitial) {
          setLoading(false);
        }
      }
    }

    fetchData(true);
    const interval = setInterval(() => fetchData(false), 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { candles, signal, loading, error };
}
