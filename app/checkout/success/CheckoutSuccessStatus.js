'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CheckoutSuccessStatus({ sessionId }) {
  const [state, setState] = useState({ status: sessionId ? 'loading' : 'error' })

  useEffect(() => {
    if (!sessionId) return
    let active = true
    let retryTimer

    async function completeCheckout(attempt = 0) {
      try {
        const response = await fetch('/api/checkout/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        })
        const data = await response.json()
        if (!active) return

        if (response.ok && data.ready) {
          setState({ status: 'ready', ...data })
        } else if (response.status === 202) {
          setState({ status: 'pending' })
          if (attempt < 9) {
            retryTimer = window.setTimeout(() => completeCheckout(attempt + 1), 1500)
          }
        } else {
          setState({ status: 'error' })
        }
      } catch {
        if (active) setState({ status: 'error' })
      }
    }

    completeCheckout()
    return () => {
      active = false
      window.clearTimeout(retryTimer)
    }
  }, [sessionId])

  if (state.status === 'loading') {
    return <p style={bodyStyle}>Platbu overujeme a pripravujeme vašu klientsku zónu…</p>
  }

  if (state.status === 'pending') {
    return <p style={bodyStyle}>Platba ešte čaká na potvrdenie. Neopakujte ju, stav sa môže aktualizovať o chvíľu.</p>
  }

  if (state.status === 'ready') {
    return <>
      {state.livemode === false ? <p style={testModeStyle}>Išlo o testovaciu platbu. Z účtu sa nič nestiahlo.</p> : null}
      {state.access_url ? (
        <p style={bodyStyle}>Testovacia klientska zóna je pripravená. Pokračujte cez bezpečný odkaz a nastavte si heslo.</p>
      ) : (
        <p style={bodyStyle}>
          Klientska zóna je pripravená. Na e-mail <strong>{state.customer_email}</strong> sme poslali odkaz na nastavenie hesla.
        </p>
      )}
      <div style={actionsStyle}>
        {state.access_url ? (
          <a href={state.access_url} style={buttonStyle}>Nastaviť heslo</a>
        ) : (
          <Link href={`/${state.project_slug}/client`} style={buttonStyle}>Otvoriť klientsku zónu</Link>
        )}
        <Link href="/login" style={secondaryButtonStyle}>Prihlásenie</Link>
      </div>
    </>
  }

  return <>
    <p style={errorStyle}>Objednávku sa nepodarilo automaticky dokončiť. Platbu prosím neopakujte.</p>
    <a href="mailto:info.yesdaystudio@gmail.com?subject=Probl%C3%A9m%20s%20objedn%C3%A1vkou%20YesDay" style={secondaryButtonStyle}>Napísať podpore</a>
  </>
}

const bodyStyle = { margin: '0 0 28px', color: '#5f5a52', lineHeight: 1.8, fontSize: '1rem' }
const testModeStyle = { margin: '0 0 20px', padding: '12px 14px', border: '1px solid #d8c59c', background: '#fff9e9', color: '#725b25', lineHeight: 1.6 }
const errorStyle = { ...bodyStyle, color: '#8b3f36' }
const actionsStyle = { display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }
const buttonStyle = { display: 'inline-block', padding: '14px 24px', background: '#1a1a1a', color: '#fff', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1.4px', fontSize: '.7rem', fontWeight: 600 }
const secondaryButtonStyle = { ...buttonStyle, border: '1px solid #1a1a1a', background: '#fff', color: '#1a1a1a' }
