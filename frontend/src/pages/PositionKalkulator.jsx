import { useMemo, useState } from 'react';

const PAIRS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'ADAUSDT',
  'AVAXUSDT',
  'LINKUSDT',
  'DOTUSDT',
  'MATICUSDT',
  'LTCUSDT',
  'UNIUSDT',
  'ATOMUSDT',
  'NEARUSDT',
  'FTMUSDT',
  'SANDUSDT',
  'MANAUSDT',
  'AXSUSDT',
  'AAVEUSDT',
];

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 'bold',
  color: '#333',
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 14,
  boxSizing: 'border-box',
};

function sideButtonStyle(isActive, color) {
  return {
    flex: 1,
    padding: '8px 16px',
    border: isActive ? `2px solid ${color}` : '1px solid #ccc',
    borderRadius: 4,
    backgroundColor: isActive ? color : '#f3f4f6',
    color: isActive ? '#fff' : '#666',
    fontWeight: isActive ? 'bold' : 'normal',
    cursor: 'pointer',
  };
}

export default function PositionKalkulator({ onBack }) {
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [pair, setPair] = useState('BTCUSDT');
  const [leverage, setLeverage] = useState(10);
  const [entry, setEntry] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [side, setSide] = useState('LONG');

  const entryNum = parseFloat(entry);
  const stopLossNum = parseFloat(stopLoss);
  const leverageNum = parseFloat(leverage);
  const accountSizeNum = parseFloat(accountSize);
  const riskPercentNum = parseFloat(riskPercent);

  const calculations = useMemo(() => {
    if (
      !entry
      || !stopLoss
      || Number.isNaN(entryNum)
      || Number.isNaN(stopLossNum)
      || entryNum <= 0
      || stopLossNum <= 0
      || Number.isNaN(accountSizeNum)
      || accountSizeNum <= 0
      || Number.isNaN(riskPercentNum)
      || riskPercentNum < 0.1
      || riskPercentNum > 100
      || Number.isNaN(leverageNum)
      || leverageNum < 1
      || leverageNum > 125
    ) {
      return null;
    }

    const invalidStopLoss =
      (side === 'LONG' && stopLossNum >= entryNum)
      || (side === 'SHORT' && stopLossNum <= entryNum);

    const slDistancePct = (Math.abs(entryNum - stopLossNum) / entryNum) * 100;
    const riskUsdt = accountSizeNum * (riskPercentNum / 100);
    const positionSizeUsdt = riskUsdt / (slDistancePct / 100);
    const positionSizeContracts = positionSizeUsdt / entryNum;
    const marginRequired = positionSizeUsdt / leverageNum;
    const liquidationPrice =
      side === 'LONG'
        ? entryNum * (1 - 1 / leverageNum)
        : entryNum * (1 + 1 / leverageNum);
    const baseSymbol = pair.replace('USDT', '');

    return {
      invalidStopLoss,
      slDistancePct,
      riskUsdt,
      positionSizeUsdt,
      positionSizeContracts,
      marginRequired,
      liquidationPrice,
      baseSymbol,
      riskPercent: riskPercentNum,
    };
  }, [accountSizeNum, entry, entryNum, leverageNum, pair, riskPercentNum, side, stopLoss, stopLossNum]);

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: 16,
          padding: 0,
          border: 'none',
          background: 'none',
          color: '#2563eb',
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        ← Tilbake til verktøy
      </button>

      <h1 style={{ margin: '0 0 8px', fontSize: 22 }}>Position Size Kalkulator</h1>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: '#666' }}>
        Beregn posisjonsstørrelse for Binance Futures
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <label htmlFor="account-size" style={labelStyle}>Kontostørrelse (USDT)</label>
          <input
            id="account-size"
            type="number"
            value={accountSize}
            onChange={(e) => setAccountSize(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="risk-percent" style={labelStyle}>Risiko %</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              id="risk-percent"
              type="number"
              min={0.1}
              max={100}
              step={0.1}
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <span style={{ fontSize: 14, color: '#666', whiteSpace: 'nowrap' }}>
              {Number.isNaN(riskPercentNum) ? '1.0' : riskPercentNum.toFixed(1)} %
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="pair" style={labelStyle}>Par</label>
          <select
            id="pair"
            value={pair}
            onChange={(e) => setPair(e.target.value)}
            style={inputStyle}
          >
            {PAIRS.map((symbol) => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="leverage" style={labelStyle}>Leverage</label>
          <input
            id="leverage"
            type="number"
            min={1}
            max={125}
            value={leverage}
            onChange={(e) => setLeverage(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="entry" style={labelStyle}>Entry-pris</label>
          <input
            id="entry"
            type="number"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="stop-loss" style={labelStyle}>Stop Loss-pris</label>
          <input
            id="stop-loss"
            type="number"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <span style={labelStyle}>Side</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setSide('LONG')}
              style={sideButtonStyle(side === 'LONG', '#22c55e')}
            >
              LONG
            </button>
            <button
              type="button"
              onClick={() => setSide('SHORT')}
              style={sideButtonStyle(side === 'SHORT', '#ef4444')}
            >
              SHORT
            </button>
          </div>
        </div>
      </div>

      {calculations && (
        <div
          style={{
            backgroundColor: 'var(--color-background-secondary)',
            borderTop: '3px solid #f7931a',
            padding: 16,
            marginBottom: 16,
          }}
        >
          {calculations.invalidStopLoss && (
            <p style={{ margin: '0 0 12px', color: '#ef4444', fontSize: 14 }}>
              Stop loss må være under entry for LONG og over entry for SHORT.
            </p>
          )}
          <p style={{ margin: '0 0 8px', fontSize: 14 }}>
            Posisjonsstørrelse: {calculations.positionSizeContracts.toFixed(4)} {calculations.baseSymbol}
          </p>
          <p style={{ margin: '0 0 8px', fontSize: 14 }}>
            Posisjonsstørrelse i USDT: {calculations.positionSizeUsdt.toFixed(3)} USDT
          </p>
          <p style={{ margin: '0 0 8px', fontSize: 14 }}>
            Nødvendig margin: {calculations.marginRequired.toFixed(3)} USDT
          </p>
          <p style={{ margin: '0 0 8px', fontSize: 14 }}>
            Risiko: {calculations.riskUsdt.toFixed(2)} USDT ({calculations.riskPercent.toFixed(1)}%)
          </p>
          <p style={{ margin: 0, fontSize: 14 }}>
            Likvidasjonspris (estimert): {calculations.liquidationPrice.toFixed(2)}
          </p>
        </div>
      )}

      <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
        Kalkulatoren er kun veiledende. Sjekk alltid Binance for eksakte verdier.
      </p>
    </div>
  );
}
