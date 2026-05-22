'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '../lib/supabase'

export default function ClientGuests({ slug: slugProp }) {
  const params = useParams()
  const slug = slugProp || params?.slug
  const router = useRouter()

  const [project, setProject] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  const packageType = String(project?.package_type || 'signature').toLowerCase().trim()
  const showAccommodationAndTransport = packageType === 'signature' || packageType === 'atelier'

  useEffect(() => {
    async function loadGuests() {
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        router.push('/login')
        return
      }

      const userId = sessionData.session.user.id
      setAccessDenied(false)

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .single()

      if (projectError || !projectData) {
        console.error(projectError)
        setLoading(false)
        return
      }

      if (projectData.owner_user_id !== userId) {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      const { data: responseData, error: responseError } = await supabase
        .from('rsvp_responses')
        .select('*')
        .eq('project_id', projectData.id)
        .order('created_at', { ascending: false })

      if (responseError) {
        console.error(responseError)
      }

      setProject(projectData)
      setResponses(responseData || [])
      setLoading(false)
    }

    if (slug) loadGuests()
  }, [slug, router])

  if (loading) {
    return <main style={{ padding: 16 }}>Načítavam hostí...</main>
  }

  if (accessDenied) {
    return <main style={{ padding: 16 }}>Access denied</main>
  }

  return (
    <section style={wrapperStyle}>
      {responses.length === 0 ? (
        <p style={emptyStyle}>Zatiaľ nebola odoslaná žiadna RSVP odpoveď.</p>
      ) : (
        responses.map((row) => {
          const people = Array.isArray(row.people) ? row.people : []

          return (
            <article key={row.id} style={cardStyle}>
              <div style={headStyle}>
                <h3 style={nameStyle}>{displayValue(row.guest_name)}</h3>
                <span style={badgeStyle(row.attending)}>{attendanceLabel(row.attending)}</span>
              </div>

              <div style={metaGridStyle}>
                <Meta label="Dospelí" value={displayValue(row.adults_count)} />
                <Meta label="Deti" value={displayValue(row.children_count)} />
                <Meta label="Vytvorené" value={formatDate(row.created_at)} />
              </div>

              <div style={blockStyle}>
                <p style={blockTitleStyle}>Menu</p>
                {people.length > 0 ? (
                  <div style={listStyle}>
                    {people.map((person, index) => (
                      <p key={`${row.id}-menu-${index}`} style={lineStyle}>
                        {displayValue(person.name)}: {menuLabel(person.menu)}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p style={lineStyle}>—</p>
                )}
              </div>

              <div style={blockStyle}>
                <p style={blockTitleStyle}>Alergie</p>
                {people.length > 0 ? (
                  <div style={listStyle}>
                    {people.map((person, index) => (
                      <p key={`${row.id}-allergy-${index}`} style={lineStyle}>
                        {displayValue(person.name)}: {hasRealAllergy(person.allergies) ? displayValue(person.allergies) : '—'}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p style={lineStyle}>—</p>
                )}
              </div>

              {showAccommodationAndTransport ? (
                <div style={metaGridStyle}>
                  <Meta
                    label="Ubytovanie"
                    value={row.needs_accommodation === true ? 'Áno' : row.needs_accommodation === false ? 'Nie' : '—'}
                  />
                  <Meta
                    label="Doprava"
                    value={hasTransportRequest(row) ? displayValue(getTransport(row)) : '—'}
                  />
                </div>
              ) : null}
            </article>
          )
        })
      )}
    </section>
  )
}

function Meta({ label, value }) {
  return (
    <div style={metaCardStyle}>
      <p style={metaLabelStyle}>{label}</p>
      <p style={metaValueStyle}>{value ?? '—'}</p>
    </div>
  )
}

function attendanceLabel(value) {
  if (value === 'yes') return 'Áno, prídu'
  if (value === 'no') return 'Nie, neprídu'
  return value || '—'
}

function hasRealAllergy(value) {
  const clean = String(value || '').toLowerCase().trim().replace(/[.!?,]/g, '')

  const noAllergyValues = [
    '', 'nie', 'nema', 'nemá', 'ziadne', 'žiadne',
    'bez', 'bez alergii', 'bez alergií', 'bez alergie'
  ]

  return !noAllergyValues.includes(clean)
}

function hasTransportRequest(row) {
  if (row.transport_needed === true || row.wants_transport === true) {
    return true
  }

  const transportValue = row.transport
  if (typeof transportValue === 'boolean') {
    return transportValue
  }

  if (typeof transportValue === 'string' && transportValue.trim()) {
    return true
  }

  const transportNote = row.transport_note
  if (typeof transportNote === 'string' && transportNote.trim()) {
    return true
  }

  const transportDetails = row.transport_details
  if (typeof transportDetails === 'string' && transportDetails.trim()) {
    return true
  }

  return false
}

function getTransport(row) {
  return row.transport || row.transport_note || row.transport_details || 'Áno'
}

function menuLabel(value) {
  const labels = {
    meat: 'Mäsové',
    vegetarian: 'Vegetariánske',
    vegan: 'Vegánske',
    child: 'Detské',
    other: 'Iné',
  }

  return labels[value] || value || '—'
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('sk-SK')
}

function displayValue(value) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string' && !value.trim()) return '—'
  return value
}

const wrapperStyle = {
  display: 'grid',
  gap: '12px',
}

const emptyStyle = {
  margin: 0,
  color: '#6f5b4b',
}

const cardStyle = {
  border: '1px solid rgba(176, 139, 105, 0.18)',
  borderRadius: '14px',
  background: 'rgba(255, 251, 246, 0.9)',
  padding: '14px',
  display: 'grid',
  gap: '12px',
}

const headStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
}

const nameStyle = {
  margin: 0,
  fontSize: '20px',
  fontWeight: 'normal',
  color: '#3f3128',
}

const badgeStyle = (attending) => ({
  padding: '5px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  color: attending === 'yes' ? '#2f5c3d' : '#7a3434',
  background: attending === 'yes' ? 'rgba(58, 128, 79, 0.14)' : 'rgba(176, 62, 62, 0.14)',
  border: attending === 'yes' ? '1px solid rgba(58, 128, 79, 0.2)' : '1px solid rgba(176, 62, 62, 0.2)',
})

const metaGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '8px',
}

const metaCardStyle = {
  border: '1px solid rgba(176, 139, 105, 0.14)',
  borderRadius: '10px',
  background: '#fffaf5',
  padding: '10px',
}

const metaLabelStyle = {
  margin: 0,
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#8a6f54',
}

const metaValueStyle = {
  margin: '6px 0 0',
  color: '#4f4035',
}

const blockStyle = {
  display: 'grid',
  gap: '6px',
}

const blockTitleStyle = {
  margin: 0,
  fontSize: '13px',
  color: '#5c493b',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const listStyle = {
  display: 'grid',
  gap: '4px',
}

const lineStyle = {
  margin: 0,
  color: '#6f5b4b',
  fontSize: '14px',
}
