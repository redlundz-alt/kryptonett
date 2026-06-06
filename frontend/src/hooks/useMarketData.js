import { useEffect, useRef, useState } from 'react';

const BASE_URL = 'https://kryptonett-backend.onrender.com';

export function useMarketData(timeframe) {
  const [candles, setCandles] = useState([]);
  const [signals, setSignals] = useState([]);
  const [history, setHistory] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const prevCandleTimestampRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    prevCandleTimestampRef.current = null;

    async function fetchData(isInitial) {
      if (isInitial) {
        setLoading(true);
      }

      try {
        const query = `?timeframe=${timeframe}`;
        const [candlesRes, signalsRes, historyRes, statisticsRes] = await Promise.all([
          fetch(`${BASE_URL}/api/candles${query}`),
          fetch(`${BASE_URL}/api/signals${query}`),
          fetch(`${BASE_URL}/api/history${query}`),
          fetch(`${BASE_URL}/api/statistics${query}`),
        ]);

        if (!candlesRes.ok || !signalsRes.ok || !historyRes.ok || !statisticsRes.ok) {
          throw new Error('Failed to fetch market data');
        }

        const candlesData = await candlesRes.json();
        const signalsData = await signalsRes.json();
        const historyData = await historyRes.json();
        const statisticsData = await statisticsRes.json();
        const latestTimestamp = candlesData.candles[candlesData.candles.length - 1]?.time;
        const dataChanged =
          isInitial || latestTimestamp !== prevCandleTimestampRef.current;

        if (!cancelled && dataChanged) {
          prevCandleTimestampRef.current = latestTimestamp;
          setCandles(candlesData.candles);
          setSignals(signalsData);
          setHistory(historyData);
          setStatistics(statisticsData);
          setLastUpdated(new Date());
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
    const interval = setInterval(() => fetchData(false), 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [timeframe]);

  return { candles, signals, history, statistics, loading, error, lastUpdated };
}
