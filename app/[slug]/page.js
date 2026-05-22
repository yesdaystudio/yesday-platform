import supabase from '../../lib/supabase'

export default async function WeddingPage({ params }) {
  const resolvedParams = await params
  const slug = resolvedParams?.slug

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single()

  if (projectError || !project) {
    return (
      <main style={emptyStateStyle}>
        <div style={emptyCardStyle}>
          <p style={eyebrowStyle}>Svadobná stránka</p>
          <h1 style={emptyTitleStyle}>Projekt sa nenašiel</h1>
          <p style={emptyTextStyle}>
            Skontrolujte prosím odkaz alebo skúste stránku otvoriť neskôr.
          </p>
        </div>
      </main>
    )
  }

  const { data: scheduleItems = [], error: scheduleError } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('project_id', project.id)
    .order('sort_order', { ascending: true })

  const { data: websiteContent } = await supabase
    .from('website_content')
    .select('*')
    .eq('project_id', project.id)
    .single()

  const wc = websiteContent || {}

  const displayDate = formatWeddingDate(project.wedding_date)
  const locationParts = [project.venue_name, project.venue_address].filter(Boolean)
  const location = locationParts.join(', ')
  const googleCalendarUrl = buildGoogleCalendarUrl(project, location)

  return (
    <main style={pageStyle}>
      <section style={heroSectionStyle}>
        <div style={heroCardStyle}>
          <p style={eyebrowStyle}>Svadobný deň</p>
          <h1 style={heroTitleStyle}>{project.couple_display_name || 'Naša svadba'}</h1>
          <p style={heroMetaStyle}>{displayDate}</p>
          <p style={heroLocationStyle}>{project.venue_name || 'Miesto bude doplnené'}</p>
          <p style={heroAddressStyle}>{project.venue_address || 'Adresa bude doplnená'}</p>

          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={buttonStyle}
          >
            Uložiť do kalendára
          </a>
          <a
  href={`/${slug}/rsvp`}
  style={{ ...buttonStyle, marginLeft: '12px' }}
>
  Potvrdiť účasť
</a>
        </div>

        {wc.welcome_text ? (
          <p style={welcomeTextStyle}>{wc.welcome_text}</p>
        ) : null}
      </section>

      {(wc.story_text) && (
        <Section title="Náš príbeh">
          <p style={placeholderStyle}>{wc.story_text}</p>
        </Section>
      )}

      <Section title="Harmonogram">
        {scheduleError ? (
          <p style={placeholderStyle}>Harmonogram sa momentálne nepodarilo načítať.</p>
        ) : scheduleItems.length > 0 ? (
          <div style={scheduleListStyle}>
            {scheduleItems.map((item) => (
              <ScheduleItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p style={placeholderStyle}>Harmonogram doplníme už čoskoro.</p>
        )}
      </Section>

      <Section title="Menu">
        <p style={placeholderStyle}>
          {wc.menu_intro_text || 'Informácie o slávnostnom menu, večernom bufete a prípadných alergiách doplníme čoskoro.'}
        </p>
      </Section>

      <Section title="Dress code">
        <p style={placeholderStyle}>
          {wc.dresscode_text || 'Dress code pre hostí zatiaľ pripravujeme. Prosíme, sledujte túto stránku pre ďalšie informácie.'}
        </p>
      </Section>

      <Section title="Ubytovanie">
        <p style={placeholderStyle}>
          {wc.accommodation_text || 'Tipy na ubytovanie v okolí zverejníme čoskoro, aby ste si vedeli pobyt pohodlne naplánovať.'}
        </p>
      </Section>

      <Section title="Doprava a parkovanie">
        <p style={placeholderStyle}>
          {wc.transport_text || 'Detaily o parkovaní a príchode na miesto svadby doplníme v najbližšej aktualizácii.'}
        </p>
      </Section>

      {wc.faq_text && (
        <Section title="FAQ">
          <p style={placeholderStyle}>{wc.faq_text}</p>
        </Section>
      )}

      <Section title="Potvrdenie účasti">
        <p style={placeholderStyle}>
          Formulár na potvrdenie účasti bude čoskoro dostupný. Ďakujeme za trpezlivosť.
        </p>
      </Section>
    </main>
  )
}

function Section({ title, children }) {
  return (
    <section style={sectionStyle}>
      <div style={sectionInnerStyle}>
        <p style={sectionEyebrowStyle}>Informácie</p>
        <h2 style={sectionTitleStyle}>{title}</h2>
        <div style={sectionContentStyle}>{children}</div>
      </div>
    </section>
  )
}

function ScheduleItem({ item }) {
  const time = item.item_time ?? item.time
  const title = item.item_title ?? item.title
  const description = item.item_description ?? item.description

  return (
    <article style={scheduleCardStyle}>
      <div style={scheduleTimeStyle}>{formatScheduleTime(time)}</div>
      <div>
        <h3 style={scheduleTitleStyle}>{title || 'Program'}</h3>
        {description ? <p style={scheduleDescriptionStyle}>{description}</p> : null}
      </div>
    </article>
  )
}

function buildGoogleCalendarUrl(project, location) {
  const datePart = normalizeDatePart(project?.wedding_date)
  const startTimePart = normalizeTimePart(project?.ceremony_time || '15:00:00')
  const endTimePart = normalizeTimePart(project?.end_time || '23:59:00')
  const title = project?.couple_display_name
    ? `Svadba ${project.couple_display_name}`
    : 'Svadobný deň'

  const details = [
    'Tešíme sa na spoločný svadobný deň.',
    project?.venue_name ? `Miesto: ${project.venue_name}` : null,
    project?.venue_address ? `Adresa: ${project.venue_address}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(title)}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(location)}` +
    `&dates=${datePart}T${startTimePart}/${datePart}T${endTimePart}`
  )
}

function formatWeddingDate(value) {
  if (!value) {
    return 'Dátum bude doplnený'
  }

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('sk-SK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatScheduleTime(value) {
  if (!value) {
    return 'Čas bude doplnený'
  }

  return String(value).slice(0, 5)
}

function normalizeDatePart(value) {
  if (!value) {
    return '20260101'
  }

  return String(value).replaceAll('-', '')
}

function normalizeTimePart(value) {
  if (!value) {
    return '150000'
  }

  const compact = String(value).replaceAll(':', '')
  return compact.padEnd(6, '0').slice(0, 6)
}

const pageStyle = {
  minHeight: '100vh',
  backgroundColor: '#f6efe6',
  backgroundImage: 'linear-gradient(180deg, #efe4d6 0%, #f6efe6 22%, #fbf7f2 100%)',
  color: '#4f4035',
  fontFamily: 'Georgia, Times New Roman, serif',
}

const heroSectionStyle = {
  padding: '48px 20px 32px',
}

const heroCardStyle = {
  maxWidth: '860px',
  margin: '0 auto',
  padding: '88px 24px',
  textAlign: 'center',
  borderRadius: '32px',
  background: 'rgba(255, 250, 244, 0.84)',
  boxShadow: '0 20px 60px rgba(106, 82, 58, 0.12)',
  border: '1px solid rgba(138, 111, 84, 0.15)',
}

const eyebrowStyle = {
  margin: 0,
  fontSize: '12px',
  letterSpacing: '0.36em',
  textTransform: 'uppercase',
  color: '#9b7c62',
}

const heroTitleStyle = {
  margin: '22px 0 14px',
  fontSize: 'clamp(44px, 8vw, 76px)',
  lineHeight: 1.05,
  fontWeight: 'normal',
  color: '#3f3128',
}

const heroMetaStyle = {
  margin: '0 0 10px',
  fontSize: '24px',
  lineHeight: 1.4,
}

const heroLocationStyle = {
  margin: '0 0 6px',
  fontSize: '22px',
  lineHeight: 1.5,
}

const heroAddressStyle = {
  margin: 0,
  fontSize: '18px',
  lineHeight: 1.7,
  color: '#6f5b4b',
}

const welcomeTextStyle = {
  maxWidth: '660px',
  margin: '32px auto 0',
  fontSize: '18px',
  lineHeight: 1.8,
  textAlign: 'center',
  color: '#6a5444',
}

const sectionStyle = {
  padding: '8px 20px 28px',
}

const sectionInnerStyle = {
  maxWidth: '860px',
  margin: '0 auto',
  padding: '40px 24px 44px',
  borderTop: '1px solid rgba(111, 91, 75, 0.16)',
}

const sectionEyebrowStyle = {
  margin: 0,
  fontSize: '12px',
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: '#b08b69',
}

const sectionTitleStyle = {
  margin: '16px 0 18px',
  fontSize: 'clamp(30px, 5vw, 42px)',
  fontWeight: 'normal',
  color: '#47372d',
}

const sectionContentStyle = {
  fontSize: '18px',
  lineHeight: 1.8,
}

const scheduleListStyle = {
  display: 'grid',
  gap: '16px',
}

const scheduleCardStyle = {
  display: 'grid',
  gridTemplateColumns: '120px 1fr',
  gap: '20px',
  alignItems: 'start',
  padding: '20px 22px',
  borderRadius: '22px',
  background: 'rgba(255, 251, 246, 0.9)',
  border: '1px solid rgba(176, 139, 105, 0.16)',
}

const scheduleTimeStyle = {
  fontSize: '18px',
  color: '#9a7557',
  letterSpacing: '0.08em',
}

const scheduleTitleStyle = {
  margin: '0 0 6px',
  fontSize: '24px',
  fontWeight: 'normal',
  color: '#3f3128',
}

const scheduleDescriptionStyle = {
  margin: 0,
  color: '#6d5a4b',
}

const placeholderStyle = {
  margin: 0,
  color: '#6f5b4b',
}

const buttonStyle = {
  display: 'inline-block',
  marginTop: '30px',
  padding: '15px 28px',
  borderRadius: '999px',
  background: '#5f4838',
  color: '#fffaf5',
  textDecoration: 'none',
  fontSize: '15px',
  letterSpacing: '0.04em',
  boxShadow: '0 12px 24px rgba(95, 72, 56, 0.18)',
}

const emptyStateStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background: '#f6efe6',
  color: '#4f4035',
  fontFamily: 'Georgia, Times New Roman, serif',
}

const emptyCardStyle = {
  maxWidth: '560px',
  width: '100%',
  padding: '56px 32px',
  textAlign: 'center',
  borderRadius: '28px',
  background: 'rgba(255, 250, 244, 0.9)',
  border: '1px solid rgba(138, 111, 84, 0.15)',
}

const emptyTitleStyle = {
  margin: '18px 0 12px',
  fontSize: '42px',
  fontWeight: 'normal',
}

const emptyTextStyle = {
  margin: 0,
  fontSize: '18px',
  lineHeight: 1.7,
}