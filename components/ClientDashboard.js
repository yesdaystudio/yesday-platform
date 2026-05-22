'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '../lib/supabase'

export default function ClientDashboard({ slug: slugProp }) {
  const params = useParams()
  const slug = slugProp || params?.slug
  const router = useRouter()

  const [project, setProject] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const packageType = String(project?.package_type || 'signature').toLowerCase().trim()
  const showAccommodationAndTransport = packageType === 'signature' || packageType === 'atelier'

  useEffect(() => {
    async function loadDashboard() {
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

      if (responseError) console.error(responseError)

      setProject(projectData)
      setResponses(responseData || [])
      setLoading(false)
    }

    if (slug) loadDashboard()
  }, [slug, router])

  const stats = useMemo(() => {
    const attending = responses.filter((r) => r.attending === 'yes')
    const people = attending.flatMap((r) => Array.isArray(r.people) ? r.people : [])

    return {
      totalResponses: responses.length,
      attendingResponses: attending.length,
      adults: attending.reduce((sum, r) => sum + Number(r.adults_count || 0), 0),
      children: attending.reduce((sum, r) => sum + Number(r.children_count || 0), 0),
      totalGuests: attending.reduce((sum, r) => sum + Number(r.adults_count || 0) + Number(r.children_count || 0), 0),
      accommodation: attending.filter((r) => r.needs_accommodation).length,
      transportRequests: responses.filter((r) => hasTransportRequest(r)).length,
      allergies: people.filter((p) => hasRealAllergy(p.allergies)).length,
    }
  }, [responses])

  const filteredResponses = responses.filter((row) => {
    const peopleText = Array.isArray(row.people)
      ? row.people.map((p) => `${p.name} ${p.menu} ${p.allergies}`).join(' ')
      : ''

    const haystack = `
      ${row.guest_name || ''}
      ${row.message || ''}
      ${row.contact_email || ''}
      ${row.contact_phone || ''}
      ${peopleText}
    `.toLowerCase()

    const matchesSearch = haystack.includes(search.toLowerCase())

    if (!matchesSearch) return false
    if (filter === 'attending') return row.attending === 'yes'
    if (filter === 'declined') return row.attending === 'no'
    if (filter === 'accommodation') return showAccommodationAndTransport && row.needs_accommodation
    if (filter === 'allergies') {
      return Array.isArray(row.people) && row.people.some((p) => hasRealAllergy(p.allergies))
    }

    return true
  })

  function hasRealAllergy(value) {
    const clean = String(value || '').toLowerCase().trim().replace(/[.!?,]/g, '')

    const noAllergyValues = [
      '', 'nie', 'nema', 'nemá', 'ziadne', 'žiadne',
      'bez', 'bez alergii', 'bez alergií', 'bez alergie'
    ]

    return !noAllergyValues.includes(clean)
  }

  function menuLabel(value) {
    const labels = {
      meat: 'Mäsové',
      vegetarian: 'Vegetariánske',
      vegan: 'Vegánske',
      child: 'Detské',
      other: 'Iné',
    }

    return labels[value] || value || '-'
  }

  function formatDate(value) {
    if (!value) return '-'
    return new Date(value).toLocaleString('sk-SK')
  }

  function attendanceLabel(value) {
    if (value === 'yes') return 'Áno, prídu'
    if (value === 'no') return 'Nie, neprídu'
    return value || '-'
  }

  function getTransport(row) {
    return row.transport || row.transport_note || row.transport_details || ''
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

  function displayValue(value) {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'string' && !value.trim()) return '—'
    return value
  }

  function formatFamilyName(row) {
    if (row.family_name) return row.family_name
    if (row.last_name) return row.last_name

    const name = String(row.guest_name || '').trim()
    if (!name.includes(' ')) return '-'

    const parts = name.split(/\s+/)
    return parts.slice(1).join(' ') || '-'
  }

  if (loading) {
    return <main style={{ padding: 40 }}>Načítavam dashboard...</main>
  }

  if (accessDenied) {
    return <main style={{ padding: 40 }}>Access denied</main>
  }

  return (
    <main style={pageStyle}>
      <h1 style={titleStyle}>{project?.couple_display_name || 'Dashboard'}</h1>

      <section style={statsGridStyle}>
        <StatCard label="RSVP odpovede" value={stats.totalResponses} />
        <StatCard label="Prichádzajúce odpovede" value={stats.attendingResponses} />
        <StatCard label="Dospelí spolu" value={stats.adults} />
        <StatCard label="Deti spolu" value={stats.children} />
        <StatCard label="Hostia spolu" value={stats.totalGuests} />
        <StatCard label="Počet alergií" value={stats.allergies} />
        {showAccommodationAndTransport ? (
          <StatCard label="Žiadosti o ubytovanie" value={stats.accommodation} />
        ) : null}
        {showAccommodationAndTransport ? (
          <StatCard label="Transport requests" value={stats.transportRequests} />
        ) : null}
      </section>

      <section style={toolbarStyle}>
        <input
          type="text"
          placeholder="Hľadať podľa mena, poznámky alebo kontaktu"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={inputStyle}
        />

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          style={selectStyle}
        >
          <option value="all">Všetky odpovede</option>
          <option value="attending">Len prídu</option>
          <option value="declined">Len neprídu</option>
          {showAccommodationAndTransport ? (
            <option value="accommodation">S ubytovaním</option>
          ) : null}
          <option value="allergies">S alergiami</option>
        </select>
      </section>

      <section style={responseListStyle}>
        {filteredResponses.length === 0 ? (
          <p style={emptyStyle}>Zatiaľ tu nie sú žiadne odpovede, ktoré zodpovedajú filtru.</p>
        ) : (
          filteredResponses.map((row) => {
            const people = Array.isArray(row.people) ? row.people : []
            const transport = getTransport(row)

            return (
              <article key={row.id} style={responseCardStyle}>
                <div style={rowHeaderStyle}>
                  <h2 style={rowTitleStyle}>{displayValue(row.guest_name)}</h2>
                  <span style={statusBadgeStyle(row.attending)}>{attendanceLabel(row.attending)}</span>
                </div>

                <div style={metaGridStyle}>
                  <MetaItem label="Priezvisko / rodina" value={displayValue(formatFamilyName(row))} />
                  <MetaItem label="Dospelí" value={displayValue(row.adults_count)} />
                  <MetaItem label="Deti" value={displayValue(row.children_count)} />
                  <MetaItem label="Vytvorené" value={formatDate(row.created_at)} />
                </div>

                <div style={sectionBlockStyle}>
                  <h3 style={sectionTitleStyle}>Výber jedla a alergie</h3>
                  {people.length > 0 ? (
                    <div style={peopleGridStyle}>
                      {people.map((person, index) => (
                        <div key={`${row.id}-person-${index}`} style={personCardStyle}>
                          <p style={personNameStyle}>{displayValue(person.name)}</p>
                          <p style={personMetaStyle}>Menu: {menuLabel(person.menu)}</p>
                          <p style={personMetaStyle}>
                            Alergie: {hasRealAllergy(person.allergies) ? displayValue(person.allergies) : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={emptyInlineStyle}>—</p>
                  )}
                </div>

                <div style={detailGridStyle}>
                  {showAccommodationAndTransport ? (
                    <DetailItem
                      label="Ubytovanie"
                      value={row.needs_accommodation === true ? 'Áno' : row.needs_accommodation === false ? 'Nie' : '—'}
                    />
                  ) : null}

                  {showAccommodationAndTransport ? (
                    <DetailItem
                      label="Detaily ubytovania"
                      value={displayValue([row.contact_email, row.contact_phone].filter(Boolean).join(' | '))}
                    />
                  ) : null}

                  {showAccommodationAndTransport ? (
                    <DetailItem label="Doprava" value={displayValue(transport)} />
                  ) : null}

                  <DetailItem label="Poznámka" value={displayValue(row.message)} />
                </div>
              </article>
            )
          })
        )}
      </section>
    </main>
  )
}

function StatCard({ label, value }) {
  return (
    <article style={statCardStyle}>
      <p style={statLabelStyle}>{label}</p>
      <p style={statValueStyle}>{value ?? '—'}</p>
    </article>
  )
}

function MetaItem({ label, value }) {
  return (
    <div style={metaItemStyle}>
      <p style={metaLabelStyle}>{label}</p>
      <p style={metaValueStyle}>{value ?? '—'}</p>
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div style={detailItemStyle}>
      <p style={detailLabelStyle}>{label}</p>
      <p style={detailValueStyle}>{value ?? '—'}</p>
    </div>
  )
}

const pageStyle = {
  display: 'grid',
  gap: '16px',
}

const titleStyle = {
  margin: 0,
  fontSize: '28px',
  fontWeight: 'normal',
  color: '#3f3128',
}

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: '12px',
}

const statCardStyle = {
  background: 'rgba(255, 251, 246, 0.92)',
  border: '1px solid rgba(176, 139, 105, 0.2)',
  borderRadius: '14px',
  padding: '12px 14px',
}

const statLabelStyle = {
  margin: 0,
  fontSize: '12px',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#8d735f',
}

const statValueStyle = {
  margin: '6px 0 0',
  fontSize: '26px',
  color: '#4a392d',
}

const toolbarStyle = {
  display: 'grid',
  gap: '10px',
}

const inputStyle = {
  width: '100%',
  border: '1px solid rgba(176, 139, 105, 0.28)',
  borderRadius: '12px',
  background: '#fffaf5',
  padding: '10px 12px',
  color: '#4f4035',
  fontFamily: 'inherit',
  fontSize: '14px',
}

const selectStyle = {
  ...inputStyle,
}

const responseListStyle = {
  display: 'grid',
  gap: '12px',
}

const responseCardStyle = {
  background: 'rgba(255, 251, 246, 0.9)',
  border: '1px solid rgba(176, 139, 105, 0.16)',
  borderRadius: '16px',
  padding: '14px',
  display: 'grid',
  gap: '12px',
}

const rowHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
}

const rowTitleStyle = {
  margin: 0,
  fontSize: '20px',
  fontWeight: 'normal',
  color: '#3f3128',
}

const statusBadgeStyle = (attending) => ({
  padding: '5px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  color: attending === 'yes' ? '#2f5c3d' : '#7a3434',
  background: attending === 'yes' ? 'rgba(58, 128, 79, 0.14)' : 'rgba(176, 62, 62, 0.14)',
  border: attending === 'yes' ? '1px solid rgba(58, 128, 79, 0.2)' : '1px solid rgba(176, 62, 62, 0.2)',
})

const metaGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: '10px',
}

const metaItemStyle = {
  background: '#fffaf5',
  border: '1px solid rgba(176, 139, 105, 0.14)',
  borderRadius: '10px',
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

const sectionBlockStyle = {
  display: 'grid',
  gap: '8px',
}

const sectionTitleStyle = {
  margin: 0,
  fontSize: '14px',
  color: '#5c493b',
}

const peopleGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '8px',
}

const personCardStyle = {
  background: '#fffaf5',
  border: '1px solid rgba(176, 139, 105, 0.14)',
  borderRadius: '10px',
  padding: '10px',
}

const personNameStyle = {
  margin: 0,
  color: '#433329',
  fontSize: '14px',
}

const personMetaStyle = {
  margin: '4px 0 0',
  color: '#6f5b4b',
  fontSize: '13px',
}

const emptyInlineStyle = {
  margin: 0,
  color: '#6f5b4b',
  fontSize: '13px',
}

const detailGridStyle = {
  display: 'grid',
  gap: '8px',
}

const detailItemStyle = {
  borderTop: '1px dashed rgba(176, 139, 105, 0.32)',
  paddingTop: '8px',
}

const detailLabelStyle = {
  margin: 0,
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#8a6f54',
}

const detailValueStyle = {
  margin: '4px 0 0',
  color: '#4f4035',
  whiteSpace: 'pre-wrap',
}

const emptyStyle = {
  margin: 0,
  padding: '14px',
  borderRadius: '12px',
  border: '1px solid rgba(176, 139, 105, 0.16)',
  background: 'rgba(255, 251, 246, 0.9)',
  color: '#6f5b4b',
}
