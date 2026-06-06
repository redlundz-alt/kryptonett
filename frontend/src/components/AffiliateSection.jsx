const cardStyle = {
  backgroundColor: '#fff',
  borderRadius: 8,
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  padding: 16,
  color: '#333',
};

const buttonStyle = {
  display: 'inline-block',
  marginTop: 12,
  padding: '10px 16px',
  backgroundColor: '#2563eb',
  color: '#fff',
  borderRadius: 6,
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 'bold',
};

export default function AffiliateSection() {
  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 16,
        }}
      >
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Kjøp krypto på Firi</h3>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: '#555' }}>
            Norges enkleste krypto-exchange. Kjøp BTC med BankID på under 5 minutter.
          </p>
          <a
            href="https://firi.com/affiliate?referral=74e7547a"
            target="_blank"
            rel="noopener noreferrer"
            style={buttonStyle}
          >
            Åpne konto hos Firi →
          </a>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Sikre din krypto</h3>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: '#555' }}>
            Hardware wallet er den sikreste måten å lagre krypto på. Anbefalt av eksperter.
          </p>
          <a
            href="https://shop.ledger.com/?r=148064ae828d"
            target="_blank"
            rel="noopener noreferrer"
            style={buttonStyle}
          >
            Kjøp Ledger →
          </a>
        </div>
      </div>

      <p style={{ margin: '12px 0 0', fontSize: 12, color: '#888', textAlign: 'center' }}>
        Annonsørlenker — vi mottar provisjon ved kjøp
      </p>
    </div>
  );
}
