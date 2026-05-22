'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import supabase from '../../../lib/supabase'

export default function RSVPPage() {
  const params = useParams()
  const slug = params.slug

  const [project, setProject] = useState(null)
  const [packageType, setPackageType] = useState('signature')
  const [loading, setLoading] = useState(true)

  const [attending, setAttending] = useState('yes')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)

  const [people, setPeople] = useState([
    { name: '', type: 'adult', menu: 'meat', allergies: '' }
  ])

  const [needsAccommodation, setNeedsAccommodation] = useState(false)
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

    const firstGuestName =
      people.find((person) => person.name.trim())?.name.trim() || 'Hosť'

    const { error } = await supabase.from('rsvp_responses').insert({
      project_id: project.id,
      guest_name: firstGuestName,
      attending,
      adults_count: attending === 'yes' ? adults : 0,
      children_count: attending === 'yes' ? children : 0,
      people: attending === 'yes' ? people : [],
      needs_accommodation: showAccommodation ? needsAccommodation : false,
      contact_email: showAccommodation && needsAccommodation ? contactEmail : null,
      contact_phone: showAccommodation && needsAccommodation ? contactPhone : null,
      message
    })

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

          {isEssential && (
            <div className="package-note">
              Tento formulár zbiera základné potvrdenie účasti. Ubytovanie a
              rozdelenie izieb sú dostupné v balíku Signature.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <label>Zúčastníte sa?</label>
          <select value={attending} onChange={(e) => setAttending(e.target.value)}>
            <option value="yes">Áno, prídeme</option>
            <option value="no">Nie, nemôžeme prísť</option>
          </select>

          {attending === 'yes' && (
            <>
              <div className="grid">
                <div>
                  <label>Počet dospelých</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={adults}
                    onChange={(e) => handleAdultsChange(e.target.value)}
                  />
                </div>

                <div>
                  <label>Počet detí</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={children}
                    onChange={(e) => handleChildrenChange(e.target.value)}
                  />
                </div>
              </div>

              <section className="guest-section">
                <label>Hostia, menu a alergie</label>

                <div className="guest-list">
                  {people.map((person, index) => (
                    <div className="guest-card" key={index}>
                      <div className="guest-card-title">
                        {person.type === 'adult'
                          ? `Dospelý hosť ${index + 1}`
                          : `Dieťa ${index + 1}`}
                      </div>

                      <input
                        type="text"
                        placeholder={
                          person.type === 'adult'
                            ? `Meno dospelej osoby ${index + 1}`
                            : `Meno dieťaťa ${index + 1}`
                        }
                        value={person.name}
                        onChange={(e) => updatePerson(index, 'name', e.target.value)}
                      />

                      <select
                        value={person.menu}
                        onChange={(e) => updatePerson(index, 'menu', e.target.value)}
                      >
                        <option value="meat">Mäsové menu</option>
                        <option value="vegetarian">Vegetariánske menu</option>
                        <option value="vegan">Vegánske menu</option>
                        <option value="child">Detské menu</option>
                        <option value="other">Iné / ešte nevieme</option>
                      </select>

                      <textarea
                        placeholder="Alergie alebo stravovacie obmedzenia pre tohto hosťa"
                        value={person.allergies}
                        onChange={(e) => updatePerson(index, 'allergies', e.target.value)}
                      />
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
                    <span>Máme záujem o pomoc s ubytovaním</span>
                  </div>

                  {needsAccommodation && (
                    <div className="contact-box">
                      <div className="small-note">
                        Kontakt zobrazujeme iba vtedy, keď hosť potrebuje
                        ubytovanie. Neskôr sem doplníme aj rozdelenie izieb v
                        dashboarde.
                      </div>

                      <label>Kontaktný email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required={needsAccommodation}
                      />

                      <label>Telefón</label>
                      <input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        required={needsAccommodation}
                      />
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          <label>Poznámka pre nevestu a ženícha</label>
          <textarea
            placeholder="Sem môžete dopísať čokoľvek dôležité."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

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

function Styles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Montserrat:wght@300;400;500;600&display=swap');

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
        max-width: 760px;
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

      form {
        margin-top: 28px;
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

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .guest-section {
        margin-top: 6px;
      }

      .guest-list {
        display: grid;
        gap: 14px;
        margin-top: 10px;
      }

      .guest-card {
        display: grid;
        gap: 10px;
        padding: 14px;
        border: 1px solid var(--border);
        background: rgba(255, 250, 244, 0.68);
      }

      .guest-card-title {
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 1.3px;
        color: var(--muted);
        font-weight: 600;
      }

      .guest-card textarea {
        min-height: 70px;
      }

      .advanced-box {
        margin-top: 22px;
        padding: 16px;
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
      }

      .contact-box {
        margin-top: 16px;
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

      button {
        width: 100%;
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
        .grid {
          grid-template-columns: 1fr;
        }

        .wrapper {
          padding: 34px 20px;
        }
      }
    `}</style>
  )
}