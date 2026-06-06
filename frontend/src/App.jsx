import { useState } from 'react';
import Chart from './components/Chart.jsx';
import ConfluenceBox from './components/ConfluenceBox.jsx';
import History from './components/History.jsx';
import SignalCard from './components/SignalCard.jsx';
import Statistics from './components/Statistics.jsx';
import StrategySelector from './components/StrategySelector.jsx';
import TimeframeSelector from './components/TimeframeSelector.jsx';
import { useMarketData } from './hooks/useMarketData.js';

const STRATEGIES = [
  { id: 'ema_crossover', name: 'EMA Crossover' },
  { id: 'macd', name: 'MACD' },
  { id: 'rsi_strategy', name: 'RSI' },
  { id: 'golden_cross', name: 'Golden Cross' },
];

export default function App() {
  const [timeframe, setTimeframe] = useState('1h');
  const [selectedStrategies, setSelectedStrategies] = useState(['ema_crossover']);
  const { candles, signals, history, statistics, loading, error, lastUpdated } = useMarketData(timeframe);

  const activeSignals = signals.filter((s) => selectedStrategies.includes(s.strategy));

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <h1 style={{ margin: 0 }}>kryptonett.no</h1>
        {lastUpdated && (
          <span style={{ fontSize: 14, color: '#666' }}>
            Sist oppdatert: {lastUpdated.toLocaleTimeString('no-NO')}
          </span>
        )}
      </div>

      <TimeframeSelector selectedTimeframe={timeframe} onSelect={setTimeframe} />

      <StrategySelector
        strategies={STRATEGIES}
        selected={selectedStrategies}
        onChange={setSelectedStrategies}
      />

      {loading && <p>Laster data...</p>}
      {error && <p>Feil: {error.message}</p>}

      {!loading && !error && (
        <>
          <Chart candles={candles} />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: 16,
              marginTop: 16,
            }}
          >
            {selectedStrategies.map((strategyId) => {
              const strategy = STRATEGIES.find((s) => s.id === strategyId);
              const signal = signals.find((s) => s.strategy === strategyId);
              if (!strategy || !signal) {
                return null;
              }
              return (
                <SignalCard
                  key={strategyId}
                  signal={signal}
                  strategyName={strategy.name}
                />
              );
            })}
          </div>

          <ConfluenceBox signals={activeSignals} />

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
