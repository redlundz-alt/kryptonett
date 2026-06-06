export default function ConfluenceBox({ signals }) {
  if (!signals || signals.length === 0) {
    return null;
  }

  const total = signals.length;
  const longCount = signals.filter((s) => s.signal === 'LONG').length;
  const shortCount = signals.filter((s) => s.signal === 'SHORT').length;
  const neutralCount = signals.filter((s) => s.signal === 'NEUTRAL').length;
  const awaitingCount = signals.filter(
    (s) => s.awaiting_confirmation || s.signal === 'AWAITING_CONFIRMATION',
  ).length;

  let backgroundColor = '#9ca3af';
  let headline = 'Blandede signaler';
  let detail = `Strategiene er uenige — anbefaler å vente. ${longCount} bullish, ${shortCount} bearish`;

  if (awaitingCount >= 1) {
    backgroundColor = '#eab308';
    headline = 'Venter på bekreftelse';
    detail = `${awaitingCount} strategi(er) har detektert signal — venter på bekreftelse over neste candle`;
  } else if (longCount === total) {
    backgroundColor = '#22c55e';
    headline = 'Sterk LONG confluence';
    detail = `Alle ${total} strategier peker oppover — sterkt kjøpssignal`;
  } else if (shortCount === total) {
    backgroundColor = '#ef4444';
    headline = 'Sterk SHORT confluence';
    detail = `Alle ${total} strategier peker nedover — sterkt salgssignal`;
  } else if (neutralCount === total) {
    backgroundColor = '#9ca3af';
    headline = 'Ingen aktive signaler';
    detail = 'Alle strategier venter på neste signal';
  } else if (longCount > shortCount && longCount > neutralCount) {
    backgroundColor = '#22c55e';
    headline = 'Svak LONG confluence';
    detail = `${longCount} av ${total} strategier peker oppover — vurder kjøp med forsiktighet`;
  } else if (shortCount > longCount && shortCount > neutralCount) {
    backgroundColor = '#ef4444';
    headline = 'Svak SHORT confluence';
    detail = `${shortCount} av ${total} strategier peker nedover — vurder salg med forsiktighet`;
  }

  const overview = `LONG: ${longCount} | SHORT: ${shortCount} | NEUTRAL: ${neutralCount} | Venter: ${awaitingCount}`;

  return (
    <div
      style={{
        backgroundColor,
        color: '#fff',
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
      }}
    >
      <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'bold' }}>{headline}</p>
      <p style={{ margin: '0 0 8px', fontSize: 14 }}>{detail}</p>
      <p style={{ margin: 0, fontSize: 12, opacity: 0.9 }}>{overview}</p>
    </div>
  );
}
