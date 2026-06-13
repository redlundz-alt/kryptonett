import { useEffect, useRef, useState } from 'react';

const BASE_URL = 'https://kryptonett-backend.onrender.com';
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;
const WAKING_UP_DELAY_MS = 3000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useMarketData(timeframe) {
  const [candles, setCandles] = useState([]);
  const [signals, setSignals] = useState([]);
  const [history, setHistory] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [cmeGap, setCmeGap] = useState(null);
  const prevCandleTimestampRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    prevCandleTimestampRef.current = null;

    async function fetchData(isInitial) {
      if (isInitial) {
        setLoading(true);
        setIsWakingUp(false);
      }

      let wakingTimer = null;
      if (isInitial) {
        wakingTimer = setTimeout(() => {
          if (!cancelled) {
            setIsWakingUp(true);
          }
        }, WAKING_UP_DELAY_MS);
      }

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
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

          if (isInitial && !cancelled) {
            clearTimeout(wakingTimer);
            setIsWakingUp(false);
            setLoading(false);
          }
          return;
        } catch (err) {
          if (attempt < MAX_ATTEMPTS && !cancelled) {
            await sleep(RETRY_DELAY_MS);
          } else if (!cancelled) {
            if (isInitial) {
              clearTimeout(wakingTimer);
              setIsWakingUp(false);
              setLoading(false);
            }
            setError(err);
          }
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

  useEffect(() => {
    let cancelled = false;

    async function fetchCmeGap() {
      try {
        const res = await fetch(`${BASE_URL}/api/cme-gap`);
        if (!res.ok) {
          throw new Error('Failed to fetch CME gap');
        }
        const data = await res.json();
        if (!cancelled) {
          setCmeGap(data);
        }
      } catch {
        // CME gap fetch failure should not block dashboard
      }
    }

    fetchCmeGap();
    const interval = setInterval(fetchCmeGap, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { candles, signals, history, statistics, loading, error, lastUpdated, isWakingUp, cmeGap };
}
