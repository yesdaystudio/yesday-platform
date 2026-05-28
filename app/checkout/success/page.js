export default function CheckoutSuccessPage() {
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <p style={labelStyle}>Platba prebehla úspešne</p>
        <h1 style={headingStyle}>Ďakujeme!</h1>
        <div style={dividerStyle} />
        <p style={bodyStyle}>
          Vaša objednávka bola prijatá. Čoskoro sa vám ozveme s ďalšími
          krokmi a prístupom do klientskej zóny.
        </p>
        <a href="/login" style={buttonStyle}>
          Klientska zóna
        </a>
      </div>
    </div>
  )
}

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  background: 'linear-gradient(180deg, #fcfaf5 0%, #f4f1ea 100%)',
  fontFamily: "'Montserrat', system-ui, sans-serif",
}

const cardStyle = {
  maxWidth: '560px',
  width: '100%',
  background: '#ffffff',
  border: '1px solid #e9e9e9',
  padding: '52px 44px',
  textAlign: 'center',
}

const labelStyle = {
  margin: '0 0 14px',
  fontSize: '11px',
  letterSpacing: '2.4px',
  textTransform: 'uppercase',
  color: '#d4af37',
  fontWeight: 600,
}

const headingStyle = {
  margin: '0 0 0',
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 'clamp(2rem, 5vw, 3rem)',
  fontWeight: 400,
  color: '#1a1a1a',
}

const dividerStyle = {
  width: '48px',
  height: '1px',
  background: '#d4af37',
  margin: '24px auto',
}

const bodyStyle = {
  margin: '0 0 36px',
  color: '#5f5a52',
  lineHeight: 1.85,
  fontSize: '1rem',
}

const buttonStyle = {
  display: 'inline-block',
  padding: '14px 36px',
  background: '#1a1a1a',
  color: '#ffffff',
  textDecoration: 'none',
  textTransform: 'uppercase',
  letterSpacing: '2px',
  fontSize: '0.72rem',
  fontWeight: 600,
}
