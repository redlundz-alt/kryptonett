import { useState } from 'react';

const SECTIONS = [
  {
    id: 'ema_crossover',
    title: 'EMA Crossover',
    ingress: 'En trend-følgende strategi basert på to glidende gjennomsnitt',
    content: [
      {
        heading: 'Hva er det',
        text: 'EMA (Exponential Moving Average) beregner gjennomsnittspris med mer vekt på nyere candles. Vi bruker EMA 9 og EMA 21.',
      },
      {
        heading: 'Hvordan fungerer det',
        text: 'Når EMA 9 krysser over EMA 21 er det et LONG-signal. Når EMA 9 krysser under EMA 21 er det et SHORT-signal.',
      },
      {
        heading: 'Best egnet',
        text: 'Trendende markeder. Fungerer dårlig i sideveis markeder.',
      },
      {
        heading: 'Signaler',
        text: 'LONG = kjøpssignal, SHORT = salgssignal, NEUTRAL = venter på crossover',
      },
      {
        heading: 'Bekreftelse',
        text: 'Vi venter på at neste candle bekrefter crossoveren før signal gis',
      },
    ],
  },
  {
    id: 'macd',
    title: 'MACD',
    ingress: 'Kombinerer trend og momentum for sterkere signaler',
    content: [
      {
        heading: 'Hva er det',
        text: 'MACD (Moving Average Convergence Divergence) måler forholdet mellom EMA 12 og EMA 26. Signal-linjen er EMA 9 av MACD-linjen.',
      },
      {
        heading: 'Hvordan fungerer det',
        text: 'Når MACD-linjen krysser over Signal-linjen er det et LONG-signal. Når den krysser under er det et SHORT-signal.',
      },
      {
        heading: 'Histogram',
        text: 'Viser avstanden mellom MACD og Signal. Positivt = bullish momentum, negativt = bearish momentum.',
      },
      {
        heading: 'Best egnet',
        text: 'Fungerer i både trendende og sideveis markeder.',
      },
      {
        heading: 'Bekreftelse',
        text: 'Neste candle må bekrefte crossoveren',
      },
    ],
  },
  {
    id: 'rsi_strategy',
    title: 'RSI — Relative Strength Index',
    ingress: 'Identifiserer når markedet er overkjøpt eller oversolgt',
    content: [
      {
        heading: 'Hva er det',
        text: 'RSI måler styrken på prisendringer på en skala fra 0-100.',
      },
      {
        heading: 'Hvordan fungerer det',
        text: 'RSI under 30 = oversolgt = LONG-signal. RSI over 70 = overkjøpt = SHORT-signal.',
      },
      {
        heading: 'Best egnet',
        text: 'Sideveis markeder og ved potensielle reverseringer. Mindre pålitelig i sterke trender.',
      },
      {
        heading: 'RSI-nivåer',
        text: 'Under 20 = ekstremt oversolgt (sterkt signal), 20-30 = oversolgt, 70-80 = overkjøpt, over 80 = ekstremt overkjøpt',
      },
      {
        heading: 'Bekreftelse',
        text: 'RSI må fortsatt være under 30 (eller over 70) på neste candle',
      },
    ],
  },
  {
    id: 'golden_cross',
    title: 'Golden Cross & Death Cross',
    ingress: 'Langsiktige signaler basert på EMA 50 og EMA 200',
    content: [
      {
        heading: 'Hva er det',
        text: 'Golden Cross og Death Cross er to av de mest anerkjente tekniske signalene i trading.',
      },
      {
        heading: 'Golden Cross',
        text: 'EMA 50 krysser over EMA 200 = sterkt LONG-signal. Indikerer langsiktig bullish trend.',
      },
      {
        heading: 'Death Cross',
        text: 'EMA 50 krysser under EMA 200 = sterkt SHORT-signal. Indikerer langsiktig bearish trend.',
      },
      {
        heading: 'Best egnet',
        text: 'Langsiktig trading og investeringer. Gir færre men sterkere signaler enn kortere EMAs.',
      },
      {
        heading: 'Merk',
        text: 'Signaler kommer sjeldnere — kan gå måneder mellom hver crossover',
      },
    ],
  },
];

function AccordionSection({ section, isOpen, onToggle }) {
  return (
    <article
      style={{
        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          padding: 16,
          border: 'none',
          borderLeft: isOpen ? '4px solid #f7931a' : '4px solid transparent',
          backgroundColor: isOpen ? '#fffaf5' : '#fff',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: '#333' }}>{section.title}</h2>
            {!isOpen && (
              <p style={{ margin: '6px 0 0', fontSize: 14, color: '#666', lineHeight: 1.4 }}>
                {section.ingress}
              </p>
            )}
          </div>
          <span
            style={{
              fontSize: 20,
              color: '#f7931a',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
              flexShrink: 0,
            }}
          >
            ▾
          </span>
        </div>
      </button>

      <div
        style={{
          maxHeight: isOpen ? '800px' : '0px',
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.3s ease',
        }}
      >
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #eee' }}>
          <p style={{ margin: '12px 0 16px', fontSize: 14, color: '#666', lineHeight: 1.5 }}>
            {section.ingress}
          </p>
          {section.content.map((block) => (
            <div key={block.heading} style={{ marginBottom: 12 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 14, color: '#333' }}>{block.heading}</h3>
              <p style={{ margin: 0, fontSize: 14, color: '#555', lineHeight: 1.5 }}>{block.text}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function Strategier() {
  const [openSection, setOpenSection] = useState(null);

  function handleToggle(id) {
    setOpenSection((current) => (current === id ? null : id));
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 16px', fontSize: 22 }}>Strategier</h1>
      {SECTIONS.map((section) => (
        <AccordionSection
          key={section.id}
          section={section}
          isOpen={openSection === section.id}
          onToggle={() => handleToggle(section.id)}
        />
      ))}
    </div>
  );
}
