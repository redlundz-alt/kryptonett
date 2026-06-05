import Chart from './components/Chart.jsx';
import SignalBox from './components/SignalBox.jsx';
import { useMarketData } from './hooks/useMarketData.js';

export default function App() {
  const { candles, signal, loading, error } = useMarketData();

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 16px' }}>kryptonett.no</h1>
      {loading && <p>Laster data...</p>}
      {error && <p>Feil: {error.message}</p>}
      {!loading && !error && (
        <>
          <Chart candles={candles} />
          <div style={{ marginTop: 16 }}>
            <SignalBox signal={signal} />
          </div>
        </>
      )}
    </div>
  );
}
