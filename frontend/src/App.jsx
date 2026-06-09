import { useEffect, useRef, useState } from 'react';
import AffiliateSection from './components/AffiliateSection.jsx';
import Chart from './components/Chart.jsx';
import ConfluenceBox from './components/ConfluenceBox.jsx';
import Footer from './components/Footer.jsx';
import History from './components/History.jsx';
import SignalCard from './components/SignalCard.jsx';
import Statistics from './components/Statistics.jsx';
import StrategySelector from './components/StrategySelector.jsx';
import { useMarketData } from './hooks/useMarketData.js';
import Strategier from './pages/Strategier.jsx';
import Verktoy from './pages/Verktoy.jsx';
import PositionKalkulator from './pages/PositionKalkulator.jsx';

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

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'strategier', label: 'Strategier' },
  { id: 'verktoy', label: 'Verktøy' },
  { id: 'guider', label: 'Guider' },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const navRef = useRef(null);
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

  useEffect(() => {
    if (!navMenuOpen) {
      return undefined;
    }
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setNavMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navMenuOpen]);

  function navigateTo(page) {
    setCurrentPage(page);
    setNavMenuOpen(false);
  }

  const currentPrice = signals[0]?.current_price;
  const prevClose = candles[candles.length - 2]?.close;
  const priceChangePct =
    currentPrice !== undefined && prevClose !== undefined
      ? ((currentPrice - prevClose) / prevClose) * 100
      : undefined;

  return (
    <div className="app-main" style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '0 16px' }}>
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
          .app-nav-link {
            padding: 12px 16px;
            border: none;
            border-bottom: 2px solid transparent;
            background: none;
            font-size: 14px;
            color: #666;
            cursor: pointer;
          }
          .app-nav-link:hover {
            color: #333;
          }
          .app-nav-link.active {
            color: #f7931a;
            border-bottom-color: #f7931a;
            font-weight: bold;
          }
          .app-nav-desktop {
            display: flex;
            gap: 4px;
          }
          .app-nav-hamburger {
            display: none;
          }
          .app-nav-dropdown {
            display: none;
          }
          .app-header {
            position: relative;
            margin-bottom: 16px;
          }
          .app-header-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 16px;
            align-items: start;
          }
          .app-header-title {
            margin: 0;
            padding: 0;
            border: none;
            background: none;
            font-size: 28px;
            line-height: 1;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            color: #333;
          }
          .app-header-stripe {
            display: inline-block;
            width: 8px;
            height: 1em;
            background-color: #f7931a;
            border-radius: 2px;
            flex-shrink: 0;
          }
          .app-header-live {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            background-color: #dcfce7;
            color: #166534;
            border-radius: 999px;
            font-size: 13px;
            font-weight: bold;
            justify-self: end;
          }
          .app-header-updated {
            display: block;
            margin-top: 6px;
            font-size: 13px;
            color: #666;
            text-align: right;
          }
          .dashboard-controls-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 16px;
          }
          .dashboard-controls-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            color: #666;
            flex-shrink: 0;
          }
          @media (max-width: 768px) {
            .app-header {
              margin-bottom: 0;
            }
            .app-header-row {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: space-between;
              width: 100%;
              padding: 12px 16px 8px 16px;
              box-sizing: border-box;
            }
            .app-header-stripe {
              width: 4px;
              height: 24px;
            }
            .app-header-live {
              justify-self: auto;
            }
            .app-header-updated {
              margin-top: 0;
              padding: 0 16px;
              font-size: 12px;
              text-align: left;
            }
            .app-nav-hamburger {
              display: block;
              padding: 8px 12px;
              border: 1px solid #ccc;
              border-radius: 4px;
              background: #f3f4f6;
              font-size: 18px;
              line-height: 1;
              color: #666;
              cursor: pointer;
            }
            .app-nav {
              display: none;
            }
            .app-nav-dropdown {
              display: none;
              position: absolute;
              top: 100%;
              right: 0;
              z-index: 10;
              min-width: 160px;
              margin-top: 4px;
              padding: 4px 0;
              background: #fff;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .app-nav-dropdown.open {
              display: flex;
              flex-direction: column;
            }
            .app-nav-dropdown .app-nav-link {
              text-align: left;
              border-bottom: none;
              border-left: 3px solid transparent;
            }
            .app-nav-dropdown .app-nav-link.active {
              border-left-color: #f7931a;
            }
            .dashboard-controls-row {
              flex-direction: column;
              align-items: stretch;
            }
            .dashboard-controls-meta {
              flex-wrap: wrap;
            }
            .timeframe-buttons {
              width: 100%;
              gap: 4px !important;
            }
            .timeframe-buttons button {
              flex: 1;
              padding: 6px 4px !important;
              font-size: 13px;
            }
            .strategy-selector-wrap > div {
              flex-wrap: wrap !important;
              overflow-x: visible;
            }
            .strategy-selector-wrap label {
              flex-shrink: 0;
              white-space: nowrap;
            }
            .signal-cards-grid > *:first-child {
              margin-top: 12px;
            }
          }
        `}
      </style>

      <div ref={navRef} className="app-header">
        <div className="app-header-row">
          <button
            type="button"
            className="app-header-title"
            onClick={() => navigateTo('dashboard')}
          >
            <span className="app-header-stripe" />
            kryptonett.no
          </button>
          <div className="app-header-live">
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
          <button
            type="button"
            className="app-nav-hamburger"
            onClick={() => setNavMenuOpen((open) => !open)}
            aria-label="Meny"
          >
            ☰
          </button>
        </div>
        {lastUpdated && (
          <span className="app-header-updated">
            Sist oppdatert: {lastUpdated.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
        <div className={`app-nav-dropdown${navMenuOpen ? ' open' : ''}`}>
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`app-nav-link${currentPage === id ? ' active' : ''}`}
              onClick={() => navigateTo(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <nav
        className="app-nav"
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 16,
          paddingBottom: 0,
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div className="app-nav-desktop">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`app-nav-link${currentPage === id ? ' active' : ''}`}
              onClick={() => navigateTo(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {currentPage === 'dashboard' && (
        <>
      <div
        style={{
          backgroundColor: 'var(--color-background-secondary)',
          borderTop: '3px solid #f7931a',
          padding: '12px 16px',
        }}
      >
        <div className="dashboard-controls-row">
          <div className="timeframe-buttons" style={{ display: 'flex', gap: 8 }}>
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

          <div className="dashboard-controls-meta">
            {currentPrice !== undefined && (
              <span>
                {`BTC: $${Number(currentPrice).toLocaleString('de-DE', { maximumFractionDigits: 0 })}`}
              </span>
            )}
            {priceChangePct !== undefined && (
              <span style={{ color: priceChangePct >= 0 ? '#16a34a' : '#dc2626' }}>
                {`${priceChangePct >= 0 ? '+' : ''}${priceChangePct.toFixed(1)}%`}
              </span>
            )}
            <span>{selectedStrategies.length} strategier aktive</span>
          </div>
        </div>

        <div className="strategy-selector-wrap">
          <StrategySelector
            strategies={STRATEGIES}
            selected={selectedStrategies}
            onChange={setSelectedStrategies}
          />
        </div>
      </div>

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
            className="signal-cards-grid"
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
            <History history={filteredHistory} selectedStrategies={selectedStrategies} />
          </div>
        </>
      )}
        </>
      )}

      {currentPage === 'strategier' && <Strategier />}

      {currentPage === 'verktoy' && <Verktoy onNavigate={navigateTo} />}

      {currentPage === 'position-kalkulator' && (
        <PositionKalkulator onBack={() => navigateTo('verktoy')} />
      )}

      {currentPage === 'guider' && (
        <p style={{ textAlign: 'center', padding: '48px 0', color: '#666', margin: 0 }}>
          Kommer snart
        </p>
      )}

      <Footer />
    </div>
  );
}
