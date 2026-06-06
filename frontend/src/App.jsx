import { useState } from 'react';
import Chart from './components/Chart.jsx';
import History from './components/History.jsx';
import SignalBox from './components/SignalBox.jsx';
import Statistics from './components/Statistics.jsx';
import TimeframeSelector from './components/TimeframeSelector.jsx';
import { useMarketData } from './hooks/useMarketData.js';

export default function App() {
  const [timeframe, setTimeframe] = useState('1h');
  const { candles, signal, history, statistics, loading, error } = useMarketData(timeframe);

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 16px' }}>kryptonett.no</h1>
      {loading && <p>Laster data...</p>}
      {error && <p>Feil: {error.message}</p>}
      {!loading && !error && (
        <>
          <TimeframeSelector selectedTimeframe={timeframe} onSelect={setTimeframe} />
          <Chart candles={candles} />
          <div style={{ marginTop: 16 }}>
            <SignalBox signal={signal} />
          </div>
          <div style={{ marginTop: 16 }}>
            <h2 style={{ margin: '0 0 8px' }}>Statistikk</h2>
            <Statistics statistics={statistics} />
          </div>
          <div style={{ marginTop: 16 }}>
            <h2 style={{ margin: '0 0 8px' }}>Signalhistorikk</h2>
            <History history={history} />
          </div>
        </>
      )}
    </div>
  );
}
