'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import supabase from '../../../lib/supabase'

export default function RSVPPage() {
  const params = useParams()
  const slug = params.slug

  const [project, setProject] = useState(null)
  const [invitation, setInvitation] = useState(null)
  const [invitationToken, setInvitationToken] = useState('')
  const [packageType, setPackageType] = useState('signature')
  const [loading, setLoading] = useState(true)

  const [attending, setAttending] = useState('yes')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)

  const [people, setPeople] = useState([
    { name: '', type: 'adult', menu: 'meat', allergies: '' }
  ])

  const [needsAccommodation, setNeedsAccommodation] = useState(false)
  const [transportRequest, setTransportRequest] = useState('')
  const [decliningGuestName, setDecliningGuestName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEssential = packageType === 'essential'
  const showAccommodation = packageType === 'signature' || packageType === 'atelier'

  useEffect(() => {
    async function loadProject() {
      const { data, error } = await supabase
        .from('projects')
        .select('id, slug, package_type')
        .eq('slug', slug)
        .single()

      if (error || !data) {
        console.error(error)
        setStatus('Nepodarilo sa načítať svadobný projekt.')
        setLoading(false)
        return
      }

      const cleanPackage = String(data.package_type || 'signature').toLowerCase().trim()

      const token = new URLSearchParams(window.location.search).get('invite') || ''
      if (token) {
        try {
          const response = await fetch(`/api/invitations/${encodeURIComponent(token)}`, { cache: 'no-store' })
          const invitationData = await response.json()
          if (!response.ok || invitationData.project_slug !== slug) {
            setStatus('Personalizovaná pozvánka sa nenašla. Skontrolujte prosím odkaz.')
          } else {
            setInvitation(invitationData)
            setInvitationToken(token)
          }
        } catch {
          setStatus('Personalizovanú pozvánku sa nepodarilo načítať.')
        }
      }

      setProject(data)
      setPackageType(cleanPackage)
      setLoading(false)
    }

    if (slug) loadProject()
  }, [slug])

  function rebuildPeople(newAdults, newChildren) {
    const total = Number(newAdults) + Number(newChildren)
    const updated = []

    for (let i = 0; i < total; i++) {
      const isAdult = i < Number(newAdults)

      updated.push({
        name: people[i]?.name || '',
        type: isAdult ? 'adult' : 'child',
        menu: people[i]?.menu || (isAdult ? 'meat' : 'child'),
        allergies: people[i]?.allergies || ''
      })
    }

    setPeople(updated)
  }

  function handleAdultsChange(value) {
    const nextAdults = Number(value)
    setAdults(nextAdults)
    rebuildPeople(nextAdults, children)
  }

  function handleChildrenChange(value) {
    const nextChildren = Number(value)
    setChildren(nextChildren)
    rebuildPeople(adults, nextChildren)
  }

  function updatePerson(index, field, value) {
    const updated = [...people]
    updated[index][field] = value
    setPeople(updated)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('')
    setIsSubmitting(true)

    if (!project?.id) {
      setStatus('Nepodarilo sa nájsť svadobný projekt.')
      setIsSubmitting(false)
      return
    }

    const firstGuestName = attending === 'yes'
      ? people.find((person) => person.name.trim())?.name.trim() || 'Hosť'
      : decliningGuestName.trim() || 'Hosť'

    const normalizedPeople = attending === 'yes'
      ? people.map((person, index) => index === 0 && transportRequest.trim()
        ? { ...person, transport_request: transportRequest.trim() }
        : person)
      : []

    const needsContact = showAccommodation && (needsAccommodation || Boolean(transportRequest.trim()))

    const responsePayload = {
      project_id: project.id,
      guest_name: firstGuestName,
      attending,
      adults_count: attending === 'yes' ? adults : 0,
      children_count: attending === 'yes' ? children : 0,
      people: normalizedPeople,
      needs_accommodation: showAccommodation ? needsAccommodation : false,
      transport: showAccommodation && attending === 'yes' ? transportRequest.trim() || null : null,
      contact_email: needsContact ? contactEmail : null,
      contact_phone: needsContact ? contactPhone : null,
      message
    }

    let error = null

    if (invitationToken) {
      try {
        const response = await fetch(`/api/invitations/${encodeURIComponent(invitationToken)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(responsePayload),
        })
        const result = await response.json()
        if (!response.ok) error = new Error(result?.error || 'Odpoveď sa nepodarilo uložiť.')
      } catch {
        error = new Error('Odpoveď sa nepodarilo uložiť.')
      }
    } else {
      const result = await supabase.from('rsvp_responses').insert(responsePayload)
      error = result.error
    }

    if (!invitationToken && isMissingTransportColumnError(error)) {
      const legacyPayload = { ...responsePayload }
      delete legacyPayload.transport
      const fallbackResult = await supabase.from('rsvp_responses').insert(legacyPayload)
      error = fallbackResult.error
    }

    if (error) {
      console.error('RSVP submit error:', error)
      setStatus(`Nepodarilo sa odoslať RSVP: ${error.message}`)
      setIsSubmitting(false)
      return
    }

    setStatus('Ďakujeme, vaša odpoveď bola uložená. ♡')
    setIsSubmitting(false)
  }

  if (loading) {
    return (
      <main className="page">
        <div className="wrapper">
          <p>Načítavam RSVP...</p>
        </div>
        <Styles />
      </main>
    )
  }

  return (
    <main className="page">
      <div className="wrapper">
        <div className="header">
          <div className="label">RSVP</div>
          <h1>Potvrdenie účasti</h1>

          <p>
            Prosíme, vyplňte mená všetkých hostí, výber menu a prípadné alergie,
            aby mohli snúbenci pripraviť presný zoznam hostí.
          </p>

          {invitation ? (
            <div className="invitation-note">
              <span>Personalizovaná pozvánka pre</span>
              <strong>{invitation.recipient_label}</strong>
              {invitation.has_responded ? <small>Vaša predošlá odpoveď už bola uložená. Opätovným odoslaním ju aktualizujete.</small> : null}
            </div>
          ) : null}

          {isEssential && (
            <div className="package-note">
              Tento formulár zbiera základné potvrdenie účasti. Ubytovanie a
              rozdelenie izieb sú dostupné v balíku Signature.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rsvp-form">
          <div className="attendance-field">
            <label htmlFor="attendance">Zúčastníte sa?</label>
            <select id="attendance" value={attending} onChange={(e) => setAttending(e.target.value)}>
              <option value="yes">Áno, prídeme</option>
              <option value="no">Nie, nemôžeme prísť</option>
            </select>
          </div>

          {attending === 'no' ? (
            <div className="decline-box compact-field">
              <label htmlFor="declining-name">Vaše meno</label>
              <input
                id="declining-name"
                type="text"
                value={decliningGuestName}
                onChange={(e) => setDecliningGuestName(e.target.value)}
                required
              />
            </div>
          ) : null}

          {attending === 'yes' && (
            <>
              <div className="count-grid">
                <div>
                  <label htmlFor="adults-count">Počet dospelých</label>
                  <input
                    id="adults-count"
                    type="number"
                    min="0"
                    max="20"
                    value={adults}
                    onChange={(e) => handleAdultsChange(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="children-count">Počet detí</label>
                  <input
                    id="children-count"
                    type="number"
                    min="0"
                    max="20"
                    value={children}
                    onChange={(e) => handleChildrenChange(e.target.value)}
                  />
                </div>
              </div>

              <section className="guest-section">
                <div className="section-heading">
                  <span>Hostia, menu a alergie</span>
                  <small>{people.length} {people.length === 1 ? 'hosť' : people.length < 5 ? 'hostia' : 'hostí'}</small>
                </div>

                <div className="guest-list">
                  {people.map((person, index) => (
                    <div className="guest-card" key={index}>
                      <div className="guest-card-title">
                        {person.type === 'adult'
                          ? `Dospelý hosť ${index + 1}`
                          : `Dieťa ${index + 1}`}
                      </div>

                      <div className="guest-fields">
                        <label>
                          <span>Meno</span>
                          <input
                            type="text"
                            placeholder={person.type === 'adult' ? 'Meno dospelej osoby' : 'Meno dieťaťa'}
                            value={person.name}
                            onChange={(e) => updatePerson(index, 'name', e.target.value)}
                            required
                          />
                        </label>
                        <label>
                          <span>Menu</span>
                          <select value={person.menu} onChange={(e) => updatePerson(index, 'menu', e.target.value)}>
                            <option value="meat">Mäsové</option>
                            <option value="vegetarian">Vegetariánske</option>
                            <option value="vegan">Vegánske</option>
                            <option value="child">Detské</option>
                            <option value="other">Iné / ešte nevieme</option>
                          </select>
                        </label>
                        <label>
                          <span>Alergie</span>
                          <input
                            type="text"
                            placeholder="Napr. orechy, lepok"
                            value={person.allergies}
                            onChange={(e) => updatePerson(index, 'allergies', e.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {showAccommodation && (
                <section className="advanced-box">
                  <div className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={needsAccommodation}
                      onChange={(e) => setNeedsAccommodation(e.target.checked)}
                    />
                    <span>Máme záujem o ubytovanie</span>
                  </div>

                  {needsAccommodation && (
                    <div className="small-note">Požiadavku uvidia snúbenci v správe ubytovania a po pridelení izby vám môžu poslať informácie o hoteli.</div>
                  )}

                  <div className="transport-field">
                    <label htmlFor="transport-request">Požiadavka na dopravu</label>
                    <input
                      id="transport-request"
                      value={transportRequest}
                      maxLength="240"
                      onChange={(e) => setTransportRequest(e.target.value)}
                      placeholder="Napr. odvoz pre 3 osoby o 01:00"
                    />
                  </div>

                  {(needsAccommodation || transportRequest.trim()) ? (
                    <div className="contact-box">
                      <div className="small-note">Kontakt slúži iba na dohodnutie ubytovania alebo dopravy.</div>
                      <div className="contact-grid">
                        <label>
                          <span>Kontaktný e-mail</span>
                          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                        </label>
                        <label>
                          <span>Telefón</span>
                          <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                        </label>
                      </div>
                    </div>
                  ) : null}
                </section>
              )}
            </>
          )}

          <div className="message-field">
            <label htmlFor="guest-message">Poznámka pre nevestu a ženícha</label>
            <textarea
              id="guest-message"
              placeholder="Sem môžete dopísať čokoľvek dôležité."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Odosielam...' : 'Odoslať potvrdenie'}
          </button>

          {status && (
            <div className={status.includes('Ďakujeme') ? 'notice' : 'error'}>
              {status}
            </div>
          )}
        </form>
      </div>

      <Styles />
    </main>
  )
}

function isMissingTransportColumnError(error) {
  if (!error) return false
  const details = [error.message, error.details, error.hint].filter(Boolean).join(' ').toLowerCase()
  return error.code === '42703' || error.code === 'PGRST204' || details.includes('transport')
}

function Styles() {
  return (
    <style jsx global>{`
      :root {
        --cream: #f4f1ea;
        --paper: #fffaf4;
        --dark: #1a1a1a;
        --muted: #777;
        --gold: #d4af37;
        --border: #e6ded3;
        --white: #ffffff;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
      }

      .page {
        font-family: 'Montserrat', sans-serif;
        background: linear-gradient(180deg, #fbf8f1 0%, var(--cream) 100%);
        color: var(--dark);
        min-height: 100vh;
        padding: 40px 18px;
      }

      .wrapper {
        max-width: 880px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid var(--border);
        padding: 42px 28px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.06);
      }

      .header {
        text-align: center;
        margin-bottom: 30px;
      }

      .label {
        color: var(--gold);
        text-transform: uppercase;
        letter-spacing: 2px;
        font-size: 0.72rem;
        font-weight: 600;
        margin-bottom: 8px;
      }

      h1 {
        font-family: 'Playfair Display', serif;
        font-size: clamp(2rem, 6vw, 3rem);
        font-weight: 400;
        margin: 0 0 12px;
      }

      .header p {
        color: var(--muted);
        line-height: 1.7;
        margin: 0 auto;
        max-width: 560px;
      }

      .rsvp-form {
        width: min(100%, 720px);
        margin-top: 28px;
        margin-right: auto;
        margin-left: auto;
      }

      label {
        display: block;
        margin: 22px 0 8px;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 1.4px;
        font-weight: 600;
      }

      input,
      select,
      textarea {
        width: 100%;
        border: 1px solid var(--border);
        background: var(--paper);
        padding: 13px 14px;
        font: inherit;
        color: var(--dark);
        border-radius: 0;
      }

      textarea {
        min-height: 95px;
        resize: vertical;
      }

      .attendance-field,
      .compact-field {
        width: min(100%, 340px);
      }

      .decline-box {
        margin-top: 24px;
        padding: 18px;
        border: 1px solid var(--border);
        background: rgba(255, 250, 244, 0.6);
      }

      .decline-box label {
        margin-top: 0;
      }

      .count-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(130px, 170px));
        gap: 14px;
        width: fit-content;
        margin-top: 8px;
      }

      .guest-section {
        margin-top: 34px;
      }

      .section-heading {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 16px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border);
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 1.4px;
        text-transform: uppercase;
      }

      .section-heading small {
        color: var(--muted);
        font-size: 0.72rem;
        font-weight: 500;
        letter-spacing: 0;
        text-transform: none;
      }

      .guest-list {
        display: grid;
        gap: 14px;
        margin-top: 10px;
      }

      .guest-card {
        padding: 18px;
        border: 1px solid var(--border);
        background: rgba(255, 250, 244, 0.68);
      }

      .guest-card-title {
        margin-bottom: 12px;
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 1.3px;
        color: var(--muted);
        font-weight: 600;
      }

      .guest-fields {
        display: grid;
        grid-template-columns: minmax(180px, 1.2fr) minmax(150px, .85fr) minmax(180px, 1fr);
        gap: 12px;
      }

      .guest-fields label,
      .contact-grid label {
        margin: 0;
      }

      .guest-fields label > span,
      .contact-grid label > span {
        display: block;
        margin-bottom: 7px;
        color: var(--muted);
        font-size: 0.68rem;
        letter-spacing: 1px;
      }

      .advanced-box {
        margin-top: 30px;
        padding: 22px;
        border: 1px solid rgba(212, 175, 55, 0.28);
        background: #fffdf8;
      }

      .checkbox-row {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #555;
      }

      .checkbox-row input {
        width: auto;
        min-width: 18px;
        min-height: 18px;
      }

      .contact-box {
        margin-top: 20px;
        padding-top: 18px;
        border-top: 1px solid var(--border);
      }

      .contact-grid {
        display: grid;
        grid-template-columns: 1.25fr .75fr;
        gap: 12px;
      }

      .transport-field {
        width: min(100%, 520px);
        margin-top: 20px;
      }

      .message-field {
        margin-top: 30px;
      }

      .small-note {
        font-size: 0.86rem;
        color: var(--muted);
        margin: 8px 0 14px;
        line-height: 1.6;
      }

      .package-note {
        margin: 18px 0 0;
        padding: 12px 14px;
        border: 1px solid rgba(212, 175, 55, 0.28);
        background: #fffdf8;
        color: #6d6255;
        font-size: 0.86rem;
        line-height: 1.6;
      }
      .invitation-note {
        display: grid;
        justify-items: center;
        gap: 5px;
        max-width: 470px;
        margin: 22px auto 0;
        padding: 16px 20px;
        border: 1px solid rgba(116, 91, 72, .18);
        background: rgba(255, 252, 248, .76);
      }
      .invitation-note span {
        font-family: Inter, Arial, sans-serif;
        font-size: 10px;
        letter-spacing: .18em;
        text-transform: uppercase;
        opacity: .62;
      }
      .invitation-note strong { font-size: 22px; font-weight: 400; }
      .invitation-note small { margin-top: 5px; line-height: 1.45; opacity: .68; }

      button {
        display: block;
        width: min(100%, 320px);
        margin-right: auto;
        margin-left: auto;
        border: none;
        background: var(--dark);
        color: var(--white);
        padding: 16px 22px;
        margin-top: 30px;
        text-transform: uppercase;
        letter-spacing: 2px;
        font-weight: 600;
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .notice,
      .error {
        margin-top: 20px;
        padding: 16px;
        line-height: 1.7;
      }

      .notice {
        border: 1px solid rgba(212, 175, 55, 0.35);
        background: #fffcf5;
        color: #5b5143;
      }

      .error {
        border: 1px solid #d9a5a5;
        background: #fff3f3;
        color: #7a2a2a;
      }

      @media (max-width: 640px) {
        .count-grid,
        .guest-fields,
        .contact-grid {
          grid-template-columns: 1fr;
          width: 100%;
        }

        .wrapper {
          padding: 34px 20px;
        }

        .advanced-box,
        .guest-card {
          padding: 16px;
        }
      }
    `}</style>
  )
}
