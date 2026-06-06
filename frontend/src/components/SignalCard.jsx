import { useEffect, useState } from 'react';

function secondsUntilNextClose(timeframe) {
  let intervalMs;
  switch (timeframe) {
    case '15m':
      intervalMs = 15 * 60 * 1000;
      break;
    case '4h':
      intervalMs = 4 * 60 * 60 * 1000;
      break;
    case '1d':
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    default:
      intervalMs = 60 * 60 * 1000;
  }

  const now = Date.now();
  const next = Math.ceil(now / intervalMs) * intervalMs;
  const remainingMs = next - now;
  return remainingMs === 0 ? intervalMs / 1000 : Math.ceil(remainingMs / 1000);
}

function formatCountdown(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function parseTradeLevels(condition) {
  const tp1 = condition.match(/(?:Take profit 1|TP1): ([\d.]+)/);
  const tp2 = condition.match(/(?:Take profit 2|TP2): ([\d.]+)/);
  const sl = condition.match(/(?:Stop loss|SL): ([\d.]+)/);
  return {
    tp1: tp1 ? tp1[1] : null,
    tp2: tp2 ? tp2[1] : null,
    sl: sl ? sl[1] : null,
  };
}

function getCardStyle(signal) {
  if (signal.awaiting_confirmation || signal.signal === 'AWAITING_CONFIRMATION') {
    return { borderColor: '#eab308', badgeBg: '#eab308', badgeText: 'Venter...' };
  }
  if (signal.signal === 'LONG') {
    return { borderColor: '#22c55e', badgeBg: '#22c55e', badgeText: 'LONG' };
  }
  if (signal.signal === 'SHORT') {
    return { borderColor: '#ef4444', badgeBg: '#ef4444', badgeText: 'SHORT' };
  }
  return { borderColor: '#9ca3af', badgeBg: '#9ca3af', badgeText: 'NEUTRAL' };
}

export default function SignalCard({ signal, strategyName }) {
  const [countdown, setCountdown] = useState('00:00');

  useEffect(() => {
    function updateCountdown() {
      setCountdown(formatCountdown(secondsUntilNextClose(signal.timeframe || '1h')));
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [signal?.timeframe]);

  if (!signal) {
    return null;
  }

  const { borderColor, badgeBg, badgeText } = getCardStyle(signal);
  const showBearishWarning =
    signal.signal === 'NEUTRAL' &&
    signal.trend === 'Bearish' &&
    signal.current_price > signal.crossover_price;
  const showBullishWarning =
    signal.signal === 'NEUTRAL' &&
    signal.trend === 'Bullish' &&
    signal.current_price < signal.crossover_price;
  const showTradeLevels = signal.signal === 'LONG' || signal.signal === 'SHORT';
  const levels = parseTradeLevels(signal.condition);
  const isMacd = signal.strategy === 'macd';

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderTop: `4px solid ${borderColor}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        color: '#333',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 'bold' }}>{strategyName}</span>
          <span
            style={{
              backgroundColor: badgeBg,
              color: '#fff',
              padding: '4px 10px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 'bold',
            }}
          >
            {badgeText}
          </span>
        </div>

        {showBearishWarning && (
          <p style={{ margin: '0 0 8px', padding: 8, backgroundColor: '#f97316', color: '#fff', borderRadius: 4, fontSize: 13 }}>
            ⚠️ Pris over crossover-nivå — venter på candle close
          </p>
        )}
        {showBullishWarning && (
          <p style={{ margin: '0 0 8px', padding: 8, backgroundColor: '#f97316', color: '#fff', borderRadius: 4, fontSize: 13 }}>
            ⚠️ Pris under crossover-nivå — venter på candle close
          </p>
        )}

        <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.4 }}>{signal.condition}</p>
        {isMacd && signal.macd_distance_pct != null && (
          <p style={{ margin: '0 0 12px', fontSize: 13 }}>Avstand MACD/Signal: {signal.macd_distance_pct}%</p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          {isMacd ? (
            <>
              <div>MACD: {signal.macd != null ? signal.macd : '–'}</div>
              <div>Signal: {signal.macd_signal != null ? signal.macd_signal : '–'}</div>
              <div
                style={{
                  color: signal.macd_histogram > 0 ? '#22c55e' : '#ef4444',
                }}
              >
                Histogram: {signal.macd_histogram != null ? signal.macd_histogram : '–'}
              </div>
              <div>RSI: {signal.rsi != null ? signal.rsi : '–'}</div>
            </>
          ) : (
            <>
              <div>EMA 9: {signal.ema9.toFixed(2)}</div>
              <div>EMA 21: {signal.ema21.toFixed(2)}</div>
              <div>RSI: {signal.rsi != null ? signal.rsi : '–'}</div>
              <div>Avstand: {signal.distance_pct.toFixed(2)}%</div>
            </>
          )}
        </div>

        {showTradeLevels && levels.tp1 && (
          <div style={{ fontSize: 13, marginBottom: 12 }}>
            <div>TP1: {levels.tp1}</div>
            <div>TP2: {levels.tp2}</div>
            <div>SL: {levels.sl}</div>
          </div>
        )}

        <p style={{ margin: 0, fontSize: 13, color: '#666' }}>Neste candle om: {countdown}</p>
      </div>
    </div>
  );
}
