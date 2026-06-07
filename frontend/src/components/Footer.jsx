export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 32,
        paddingTop: 16,
        borderTop: '1px solid #e5e7eb',
        fontSize: 12,
        color: '#888',
        lineHeight: 1.5,
      }}
    >
      <p style={{ margin: '0 0 8px' }}>
        ⚠️ Ikke finansiell rådgivning. kryptonett.no er et teknisk analyseverktøy for informasjonsformål.
        All trading innebærer risiko — gjør alltid din egen research før du handler.
      </p>
      <p style={{ margin: 0 }}>© 2026 kryptonett.no</p>
    </footer>
  );
}
