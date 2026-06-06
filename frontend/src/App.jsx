import { useState } from 'react';
import AffiliateSection from './components/AffiliateSection.jsx';
import Chart from './components/Chart.jsx';
import ConfluenceBox from './components/ConfluenceBox.jsx';
import History from './components/History.jsx';
import SignalCard from './components/SignalCard.jsx';
import Statistics from './components/Statistics.jsx';
import StrategySelector from './components/StrategySelector.jsx';
import { useMarketData } from './hooks/useMarketData.js';

const STRATEGIES = [
  { id: 'ema_crossover', name: 'EMA Crossover' },
  { id: 'macd', name: 'MACD' },
  { id: 'rsi_strategy', name: 'RSI' },
  { id: 'golden_cross', name: 'Golden Cross' },
];

const TIMEFRAMES = [
  { value: '15m', label: '15m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
];

export default function App() {
  const [timeframe, setTimeframe] = useState('1h');
  const [selectedStrategies, setSelectedStrategies] = useState(['ema_crossover']);
  const { candles, signals, history, statistics, loading, error, lastUpdated } = useMarketData(timeframe);

  const activeSignals = signals.filter((s) => selectedStrategies.includes(s.strategy));

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
      <style>
        {`
          @keyframes livePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.85); }
          }
        `}
      </style>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 16,
          marginBottom: 16,
          alignItems: 'start',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: '1em',
                backgroundColor: '#f7931a',
                borderRadius: 2,
                flexShrink: 0,
              }}
            />
            kryptonett.no
          </h1>
          <p style={{ margin: '8px 0 0 18px', fontSize: 13, color: '#666', lineHeight: 1.4 }}>
            Teknisk analyse av Bitcoin i sanntid — EMA Crossover, MACD, RSI og Golden Cross
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 6,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 'bold',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                animation: 'livePulse 1.5s ease-in-out infinite',
              }}
            />
            Live
          </div>
          {lastUpdated && (
            <span style={{ fontSize: 13, color: '#666' }}>
              Sist oppdatert: {lastUpdated.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <span style={{ fontSize: 13, color: '#666' }}>
            BTC/USD · {selectedStrategies.length} strategier aktive
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {TIMEFRAMES.map(({ value, label }) => {
          const isActive = timeframe === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTimeframe(value)}
              style={{
                padding: '8px 16px',
                border: isActive ? '2px solid #f7931a' : '1px solid #ccc',
                borderRadius: 4,
                backgroundColor: isActive ? '#f7931a' : '#f3f4f6',
                color: isActive ? '#fff' : '#666',
                fontWeight: isActive ? 'bold' : 'normal',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

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

          <AffiliateSection />

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
