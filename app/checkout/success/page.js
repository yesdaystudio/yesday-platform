import CheckoutSuccessStatus from './CheckoutSuccessStatus'

export default async function CheckoutSuccessPage({ searchParams }) {
  const params = await searchParams
  const sessionId = typeof params?.session_id === 'string' ? params.session_id : ''

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <p style={labelStyle}>Objednávka YesDay</p>
        <h1 style={headingStyle}>Ďakujeme!</h1>
        <div style={dividerStyle} />
        <CheckoutSuccessStatus sessionId={sessionId} />
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
