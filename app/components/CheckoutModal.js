'use client'

import { useState } from 'react'
import Image from 'next/image'

const DESIGNS = {
  diana: { name: 'Diana', image: '/templates/diana/diana-anton-hero.png' },
  penelope: { name: 'Penelope', image: '/templates/penelope/hero-v2.jpg' },
  botanique: { name: 'Botanique', image: '/templates/botanique/hero.jpg' },
}

export default function CheckoutModal({ packageName, packageType, packagePrice, selectedDesign = 'diana', onClose }) {
  const [email, setEmail] = useState('')
  const [coupleName, setCoupleName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const design = DESIGNS[selectedDesign] || DESIGNS.diana

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email || !email.includes('@')) {
      setError('Zadajte platný e-mail.')
      return
    }
    if (!coupleName.trim()) {
      setError('Zadajte mená páru.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_type: packageType,
          couple_display_name: coupleName.trim(),
          slug: slug.trim() || undefined,
          customer_email: email.trim(),
          design_family: DESIGNS[selectedDesign] ? selectedDesign : 'diana',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Nastala chyba. Skúste prosím znova.')
        return
      }

      window.location.href = data.url
    } catch {
      setError('Nastala chyba. Skúste prosím znova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeButtonStyle} onClick={onClose} aria-label="Zavrieť">
          &#x2715;
        </button>

        <p style={modalLabelStyle}>Vaša objednávka</p>
        <div style={orderSummaryStyle}>
          <Image src={design.image} alt="" width={184} height={132} style={orderThumbnailStyle} />
          <div>
            <h2 style={modalHeadingStyle}>{design.name} + {packageName}</h2>
            <p style={modalPriceStyle}>{packagePrice}</p>
          </div>
        </div>
        <div style={modalDividerStyle} />

        <form onSubmit={handleSubmit} noValidate>
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="yd-email">
              Váš e-mail
            </label>
            <input
              id="yd-email"
              type="email"
              required
              autoComplete="email"
              placeholder="vas@email.sk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="yd-couple">
              Mená páru
            </label>
            <input
              id="yd-couple"
              type="text"
              required
              placeholder="napr. Mária &amp; Tomáš"
              value={coupleName}
              onChange={(e) => setCoupleName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="yd-slug">
              Požadovaná adresa webu{' '}
              <span style={optionalStyle}>(voliteľné)</span>
            </label>
            <input
              id="yd-slug"
              type="text"
              placeholder="napr. maria-tomas"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={inputStyle}
            />
            <p style={hintStyle}>
              Váš web bude dostupný na adrese yesdaystudio.com/[adresa].
            </p>
          </div>

          {error && <p style={errorStyle}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...submitButtonStyle, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Presmerovávam...' : 'Pokračovať k platbe'}
          </button>
        </form>
      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 2000,
  background: 'rgba(26,26,26,0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  backdropFilter: 'blur(4px)',
}

const modalStyle = {
  position: 'relative',
  background: '#ffffff',
  border: '1px solid #e9e9e9',
  padding: '48px 44px',
  width: '100%',
  maxWidth: '480px',
  fontFamily: "'Montserrat', system-ui, sans-serif",
}

const closeButtonStyle = {
  position: 'absolute',
  top: '18px',
  right: '18px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '18px',
  color: '#888',
  lineHeight: 1,
  padding: '4px',
}

const modalLabelStyle = {
  margin: '0 0 8px',
  fontSize: '11px',
  letterSpacing: '2.4px',
  textTransform: 'uppercase',
  color: '#d4af37',
  fontWeight: 600,
}

const modalHeadingStyle = {
  margin: 0,
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '2rem',
  fontWeight: 400,
  color: '#1a1a1a',
}

const orderSummaryStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
}

const orderThumbnailStyle = {
  width: '92px',
  height: '66px',
  flex: '0 0 92px',
  objectFit: 'cover',
}

const modalPriceStyle = {
  margin: '8px 0 0',
  color: '#5f5a52',
  fontSize: '1rem',
  fontWeight: 600,
}

const modalDividerStyle = {
  width: '40px',
  height: '1px',
  background: '#d4af37',
  margin: '20px 0 28px',
}

const fieldGroupStyle = {
  marginBottom: '20px',
}

const labelStyle = {
  display: 'block',
  marginBottom: '7px',
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: '#1a1a1a',
}

const optionalStyle = {
  color: '#888',
  textTransform: 'none',
  letterSpacing: 0,
  fontWeight: 400,
  fontSize: '11px',
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #e9e9e9',
  background: '#fafafa',
  fontFamily: 'inherit',
  fontSize: '0.95rem',
  color: '#1a1a1a',
  boxSizing: 'border-box',
  outline: 'none',
}

const hintStyle = {
  margin: '6px 0 0',
  fontSize: '12px',
  color: '#888',
}

const errorStyle = {
  margin: '0 0 16px',
  fontSize: '13px',
  color: '#b91c1c',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  padding: '10px 14px',
}

const submitButtonStyle = {
  display: 'block',
  width: '100%',
  marginTop: '8px',
  padding: '15px 22px',
  background: '#1a1a1a',
  color: '#ffffff',
  border: 'none',
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '2px',
  fontSize: '0.72rem',
  fontWeight: 600,
  fontFamily: 'inherit',
}
