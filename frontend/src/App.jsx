import { useEffect, useState } from 'react';
import AffiliateSection from './components/AffiliateSection.jsx';
import Chart from './components/Chart.jsx';
import ConfluenceBox from './components/ConfluenceBox.jsx';
import History from './components/History.jsx';
import SignalCard from './components/SignalCard.jsx';
import Statistics from './components/Statistics.jsx';
import StrategySelector from './components/StrategySelector.jsx';
import { useMarketData } from './hooks/useMarketData.js';
import Strategier from './pages/Strategier.jsx';

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
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [timeframe, setTimeframe] = useState('1h');
  const [selectedStrategies, setSelectedStrategies] = useState(['ema_crossover']);
  const { candles, signals, history, statistics, loading, error, lastUpdated, isWakingUp } = useMarketData(timeframe);

  const activeSignals = signals.filter((s) => selectedStrategies.includes(s.strategy));
  const filteredStatistics = statistics
    ? Object.fromEntries(
        Object.entries(statistics).filter(([strategy]) => selectedStrategies.includes(strategy)),
      )
    : statistics;
  const filteredHistory = history
    ? history.filter((entry) => selectedStrategies.includes(entry.strategy))
    : history;

  useEffect(() => {
    document.documentElement.lang = 'no';
  }, []);

  useEffect(() => {
    document.title =
      currentPage === 'strategier'
        ? 'Strategier — kryptonett.no'
        : 'kryptonett.no — Live Bitcoin trading-signaler';
  }, [currentPage]);

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
      <style>
        {`
          @keyframes livePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.85); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
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
          <button
            type="button"
            onClick={() => setCurrentPage('dashboard')}
            style={{
              margin: 0,
              padding: 0,
              border: 'none',
              background: 'none',
              fontSize: 28,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              color: '#333',
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
          </button>
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
          <button
            type="button"
            onClick={() => setCurrentPage('strategier')}
            style={{
              padding: '8px 16px',
              border: currentPage === 'strategier' ? '2px solid #f7931a' : '1px solid #ccc',
              borderRadius: 4,
              backgroundColor: currentPage === 'strategier' ? '#f7931a' : '#f3f4f6',
              color: currentPage === 'strategier' ? '#fff' : '#666',
              fontWeight: currentPage === 'strategier' ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
          >
            Strategier
          </button>
          <span style={{ fontSize: 13, color: '#666' }}>
            BTC/USD · {selectedStrategies.length} strategier aktive
          </span>
        </div>
      </div>

      {currentPage === 'dashboard' && (
        <>
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

      {loading && !isWakingUp && <p>Laster data...</p>}
      {loading && isWakingUp && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div
            style={{
              width: 32,
              height: 32,
              margin: '0 auto 12px',
              border: '3px solid #e5e7eb',
              borderTopColor: '#f7931a',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 'bold' }}>Vekker opp serveren...</p>
          <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
            Dette tar vanligvis 30-60 sekunder ved første besøk
          </p>
        </div>
      )}
      {error && (
        <div style={{ padding: '16px 0' }}>
          <p style={{ margin: '0 0 12px' }}>Feil: {error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: 4,
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            Prøv igjen
          </button>
        </div>
      )}

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
            <Statistics statistics={filteredStatistics} />
          </div>

          <div style={{ marginTop: 16 }}>
            <h2 style={{ margin: '0 0 8px' }}>Signalhistorikk</h2>
            <History history={filteredHistory} />
          </div>
        </>
      )}
        </>
      )}

      {currentPage === 'strategier' && <Strategier />}
    </div>
  );
}
