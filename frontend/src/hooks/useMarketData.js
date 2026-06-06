import { useEffect, useState } from 'react';

const BASE_URL = 'https://kryptonett-backend.onrender.com';

export function useMarketData(timeframe) {
  const [candles, setCandles] = useState([]);
  const [signal, setSignal] = useState(null);
  const [history, setHistory] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData(isInitial) {
      if (isInitial) {
        setLoading(true);
      }

      try {
        const query = `?timeframe=${timeframe}`;
        const [candlesRes, signalRes, historyRes, statisticsRes] = await Promise.all([
          fetch(`${BASE_URL}/api/candles${query}`),
          fetch(`${BASE_URL}/api/signal${query}`),
          fetch(`${BASE_URL}/api/history${query}`),
          fetch(`${BASE_URL}/api/statistics${query}`),
        ]);

        if (!candlesRes.ok || !signalRes.ok || !historyRes.ok || !statisticsRes.ok) {
          throw new Error('Failed to fetch market data');
        }

        const candlesData = await candlesRes.json();
        const signalData = await signalRes.json();
        const historyData = await historyRes.json();
        const statisticsData = await statisticsRes.json();

        if (!cancelled) {
          setCandles(candlesData.candles);
          setSignal(signalData);
          setHistory(historyData);
          setStatistics(statisticsData);
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
  }, [timeframe]);

  return { candles, signal, history, statistics, loading, error };
}
