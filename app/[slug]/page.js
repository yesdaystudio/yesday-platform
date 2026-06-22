import { Cormorant_Garamond, Great_Vibes, Inter, Ms_Madi } from 'next/font/google'
import supabase from '../../lib/supabase'
import DianaStickyHeader from './DianaStickyHeader'

const dianaContentFont = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

const dianaLabelFont = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

const dianaHeroCurrentFont = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

const dianaHeroMsMadiFont = Ms_Madi({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

const dianaHeroFontVariant = 'current'

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
  const designFamily = resolveDesignFamily(project.design_family)
  const themeStyles = getThemeStyles(designFamily)
  const colorVariant = resolveColorVariant(project.color_variant)
  const colorTheme = getColorTheme(colorVariant)
  const isDianaHero = designFamily === 'diana'
  const ceremonyTime = formatScheduleTime(project.ceremony_time || scheduleItems[0]?.item_time || scheduleItems[0]?.time)
  const celebrationTime = formatScheduleTime(project.reception_time)

  return (
    <main style={{ ...pageStyle, ...themeStyles.page, ...colorTheme.page }}>
      {isDianaHero ? <DianaStickyHeader rsvpHref={`/${slug}/rsvp`} /> : null}
      <section style={{ ...heroSectionStyle, ...themeStyles.heroSection }}>
        <div style={{ ...heroCardStyle, ...themeStyles.heroCard, ...(isDianaHero ? {} : colorTheme.heroCard) }}>
          {isDianaHero ? (
            <DianaHero coupleName={project.couple_display_name} styles={themeStyles} />
          ) : (
            <>
              <p style={{ ...eyebrowStyle, ...themeStyles.eyebrow, ...colorTheme.eyebrow }}>Svadobný deň</p>
              <h1 style={{ ...heroTitleStyle, ...themeStyles.heroTitle, ...colorTheme.heroTitle }}>{project.couple_display_name || 'Naša svadba'}</h1>
              <p style={{ ...heroMetaStyle, ...themeStyles.heroMeta, ...colorTheme.heroMeta }}>{displayDate}</p>
              <p style={{ ...heroLocationStyle, ...themeStyles.heroLocation, ...colorTheme.heroLocation }}>{project.venue_name || 'Miesto bude doplnené'}</p>
              <p style={{ ...heroAddressStyle, ...themeStyles.heroAddress, ...colorTheme.heroAddress }}>{project.venue_address || 'Adresa bude doplnená'}</p>

              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...buttonStyle, ...themeStyles.button, ...colorTheme.button }}
              >
                Uložiť do kalendára
              </a>
              <a
                href={`/${slug}/rsvp`}
                style={{ ...buttonStyle, ...themeStyles.button, ...colorTheme.button, marginLeft: '12px' }}
              >
                Potvrdiť účasť
              </a>
            </>
          )}
        </div>

        {!isDianaHero && wc.welcome_text ? (
          <p style={{ ...welcomeTextStyle, ...themeStyles.welcomeText, ...colorTheme.welcomeText }}>{wc.welcome_text}</p>
        ) : null}
      </section>

      {isDianaHero ? (
        <DianaEditorialContent
          project={project}
          wc={wc}
          scheduleItems={scheduleItems}
          scheduleError={scheduleError}
          displayDate={displayDate}
          ceremonyTime={ceremonyTime}
          celebrationTime={celebrationTime}
          googleCalendarUrl={googleCalendarUrl}
          slug={slug}
          styles={themeStyles}
        />
      ) : (
        <>
          {wc.story_text ? (
            <Section title="Náš príbeh">
              <p style={placeholderStyle}>{wc.story_text}</p>
            </Section>
          ) : null}

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
        </>
      )}
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

function DianaHero({ coupleName, styles }) {
  const [firstPartner, secondPartner] = splitCoupleName(coupleName)

  return (
    <div style={styles.heroBackground}>
      <h1 style={styles.heroTitle} aria-label={formatCoupleNameLabel(firstPartner, secondPartner)}>
        <span style={{ ...styles.heroNameLine, ...styles.heroFirstName }}>{firstPartner}</span>
        {secondPartner ? (
          <>
            <span style={styles.heroAmpersand}>a</span>
            <span style={{ ...styles.heroNameLine, ...styles.heroSecondName }}>{secondPartner}</span>
          </>
        ) : null}
      </h1>
    </div>
  )
}

function DianaEditorialContent({
  project,
  wc,
  scheduleItems,
  scheduleError,
  displayDate,
  ceremonyTime,
  celebrationTime,
  googleCalendarUrl,
  slug,
  styles,
}) {
  const receptionVenueName = project.reception_venue_name || project.venue_name || 'Miesto oslavy bude doplnené'
  const receptionVenueAddress = project.reception_venue_address || project.venue_address || 'Adresa bude doplnená'
  const chronologicalScheduleItems = [...scheduleItems].sort(
    (first, second) => getScheduleTimeMinutes(first) - getScheduleTimeMinutes(second)
  )

  return (
    <section id="info" style={styles.editorialSection}>
      <DianaEditorialBlock title={displayDate} styles={styles} noDivider compact />

      {wc.welcome_text ? (
        <DianaEditorialBlock eyebrow="Vitajte" title={wc.welcome_text} styles={styles} />
      ) : null}

      <DianaEditorialBlock
        eyebrow="Obrad"
        title={ceremonyTime}
        styles={styles}
        titleStyle={styles.editorialTimingTitle}
        contentStyle={styles.editorialTimingContent}
      >
        <p style={styles.editorialTimingVenue}>{project.venue_name || 'Miesto obradu bude doplnené'}</p>
        <p style={styles.editorialTimingAddress}>{project.venue_address || 'Adresa bude doplnená'}</p>
      </DianaEditorialBlock>

      <DianaEditorialSplitBlock
        eyebrow="Oslava"
        title={celebrationTime}
        imageSrc="/images/diana/champagne-tower.jpg"
        imageAlt="Svadobný prípitok so šampanským"
        imageSide="right"
        variant="celebration"
        styles={styles}
        titleStyle={{ ...styles.editorialTimingTitle, ...styles.editorialCelebrationTitle }}
        contentStyle={styles.editorialTimingContent}
        copyStyle={styles.editorialTimingSplitCopy}
      >
        <p style={styles.editorialCelebrationVenue}>{receptionVenueName}</p>
        <p style={styles.editorialCelebrationAddress}>{receptionVenueAddress}</p>
      </DianaEditorialSplitBlock>

      {wc.story_text ? (
        <DianaEditorialBlock id="about" eyebrow="O nás" title="Náš príbeh" styles={styles}>
          <DianaEditorialText styles={styles}>{wc.story_text}</DianaEditorialText>
        </DianaEditorialBlock>
      ) : null}

      <DianaEditorialBlock id="program" title="Harmonogram" styles={styles}>
        {scheduleError ? (
          <p style={styles.editorialBody}>Harmonogram sa momentálne nepodarilo načítať.</p>
        ) : chronologicalScheduleItems.length > 0 ? (
          <div style={styles.editorialScheduleList}>
            {chronologicalScheduleItems.map((item) => (
              <DianaScheduleItem key={item.id} item={item} styles={styles} />
            ))}
          </div>
        ) : (
          <p style={styles.editorialBody}>Harmonogram doplníme už čoskoro.</p>
        )}
      </DianaEditorialBlock>

      <DianaEditorialSplitBlock
        title="Slávnostné menu"
        imageSrc="/images/diana/menu.jpg"
        imageAlt="Slávnostné menu"
        variant="menu"
        styles={styles}
        mediaStyle={styles.editorialMenuMedia}
        imageStyle={styles.editorialMenuImage}
        copyStyle={styles.editorialMenuCopy}
      >
        <DianaMenuText styles={styles}>
          {wc.menu_intro_text || `PREDJEDLO

Kozí syr v pistáciovej kruste
s medovo-horčicovým dressingom
a mladými šalátovými lístkami

POLIEVKA

Consommé z bažanta
s koreňovou zeleninou a bylinkami

HLAVNÉ JEDLO

Hovädzie líčka braizované
na červenom víne`}
        </DianaMenuText>
      </DianaEditorialSplitBlock>

      <DianaEditorialBlock eyebrow="Dress code" title="Štýl večera" styles={styles}>
        <DianaEditorialText styles={styles}>
          {wc.dresscode_text || 'Dress code pre hostí zatiaľ pripravujeme. Prosíme, sledujte túto stránku pre ďalšie informácie.'}
        </DianaEditorialText>
      </DianaEditorialBlock>

      <DianaAccommodationParkingSection wc={wc} styles={styles} />

      {wc.faq_text ? (
        <DianaEditorialBlock eyebrow="Faq" title="Otázky hostí" styles={styles}>
          <DianaEditorialText styles={styles}>{wc.faq_text}</DianaEditorialText>
        </DianaEditorialBlock>
      ) : null}

      <DianaEditorialBlock eyebrow="Rsvp" title="Potvrdenie účasti" styles={styles}>
        <p style={styles.editorialBody}>Prosíme, potvrďte svoju účasť a uložte si svadobný deň do kalendára.</p>
        <div style={styles.editorialActions}>
          <a href={`/${slug}/rsvp`} style={styles.editorialPrimaryAction}>
            Potvrdiť účasť
          </a>
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.editorialSecondaryAction}
          >
            Uložiť do kalendára
          </a>
        </div>
      </DianaEditorialBlock>
    </section>
  )
}

function DianaEditorialBlock({
  id,
  eyebrow,
  title,
  children,
  styles,
  eyebrowStyle,
  titleStyle,
  contentStyle,
  noDivider = false,
  compact = false,
  menuBackground = false,
}) {
  return (
    <article
      id={id}
      style={{
        ...styles.editorialBlock,
        ...(noDivider ? styles.editorialBlockFirst : {}),
        ...(compact ? styles.editorialBlockCompact : {}),
        ...(menuBackground ? styles.editorialMenuBlock : {}),
      }}
    >
      {eyebrow ? <p style={{ ...styles.editorialEyebrow, ...eyebrowStyle }}>{eyebrow}</p> : null}
      <h2 style={{ ...styles.editorialTitle, ...(compact ? styles.editorialTitleCompact : {}), ...titleStyle }}>{title}</h2>
      {children ? <div style={{ ...styles.editorialContent, ...contentStyle }}>{children}</div> : null}
    </article>
  )
}

function DianaEditorialSplitBlock({
  eyebrow,
  title,
  meta,
  imageSrc,
  imageAlt,
  imageSide = 'left',
  variant,
  children,
  styles,
  eyebrowStyle,
  titleStyle,
  contentStyle,
  copyStyle,
  mediaStyle,
  imageStyle,
}) {
  const imageRight = imageSide === 'right'
  const isCeremony = variant === 'ceremony'
  const isCelebration = variant === 'celebration'
  const isMenu = variant === 'menu'
  const splitBlockStyle = isMenu
    ? {
      ...styles.editorialSplitBlock,
      width: '100%',
      maxWidth: 'none',
      margin: '0',
    }
    : styles.editorialSplitBlock
  const className = [
    'dianaEditorialSplit',
    imageRight ? 'dianaEditorialSplit--imageRight' : null,
    isCeremony ? 'dianaEditorialSplit--ceremony' : null,
    isCelebration ? 'dianaEditorialSplit--celebration' : null,
    isMenu ? 'dianaEditorialSplit--menu' : null,
  ].filter(Boolean).join(' ')

  return (
    <article
      className={className}
      style={{
        ...styles.editorialBlock,
        ...splitBlockStyle,
        ...(isCeremony ? styles.editorialCeremonySplitBlock : {}),
      }}
    >
      <div className="dianaEditorialSplit__media" style={{ ...styles.editorialSplitMedia, ...(mediaStyle || {}) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={imageAlt}
          className={isCelebration ? 'dianaEditorialSplit__image--celebration' : undefined}
          style={{ ...(isCelebration ? styles.editorialCelebrationImage : styles.editorialSplitImage), ...(imageStyle || {}) }}
        />
      </div>
      <div className="dianaEditorialSplit__copy" style={{ ...styles.editorialSplitCopy, ...copyStyle }}>
        {eyebrow ? <p style={{ ...styles.editorialEyebrow, ...eyebrowStyle }}>{eyebrow}</p> : null}
        <h2 style={{ ...styles.editorialTitle, ...titleStyle }}>{title}</h2>
        {meta ? <p style={styles.editorialSplitMeta}>{meta}</p> : null}
        {children ? <div style={{ ...styles.editorialContent, ...contentStyle }}>{children}</div> : null}
      </div>
    </article>
  )
}

function DianaEditorialText({ children, styles }) {
  return (
    <p className="whitespace-pre-line" style={styles.editorialBody}>
      {children}
    </p>
  )
}

function DianaAccommodationParkingSection({ wc, styles }) {
  return (
    <article style={{ ...styles.editorialBlock, ...styles.editorialTwoColumnBlock }}>
      <div className="dianaEditorialTwoColumn" style={styles.editorialTwoColumnGrid}>
        <section style={styles.editorialTwoColumnItem}>
          <p style={styles.editorialEyebrow}>Ubytovanie</p>
          <h2 style={styles.editorialColumnTitle}>Pobyt v okolí</h2>
          <p className="whitespace-pre-line" style={styles.editorialColumnBody}>
            {wc.accommodation_text || 'Tipy na ubytovanie v okolí zverejníme čoskoro, aby ste si vedeli pobyt pohodlne naplánovať.'}
          </p>
        </section>

        <section style={styles.editorialTwoColumnItem}>
          <p style={styles.editorialEyebrow}>Parkovanie</p>
          <h2 style={styles.editorialColumnTitle}>Príchod a parkovanie</h2>
          <p className="whitespace-pre-line" style={styles.editorialColumnBody}>
            {wc.transport_text || 'Detaily o parkovaní a príchode na miesto svadby doplníme v najbližšej aktualizácii.'}
          </p>
        </section>
      </div>
    </article>
  )
}

function DianaMenuText({ children, styles }) {
  const lines = String(children || '').split(/\r?\n/)
  const courses = lines.reduce((groups, line) => {
    if (line.trim() === '') {
      if (groups[groups.length - 1]?.length) {
        groups.push([])
      }
      return groups
    }

    groups[groups.length - 1].push(line)
    return groups
  }, [[]]).filter((group) => group.length > 0)

  return (
    <div style={styles.editorialMenuText}>
      {courses.map((course, index) => {
        const [heading, ...details] = course
        const description = details.join('\n').trim()
        return (
          <div key={`${index}-${heading}`} style={{ ...styles.editorialMenuCourse, ...(index === 0 ? styles.editorialMenuCourseFirst : {}) }}>
            <p className="whitespace-pre-line" style={styles.editorialMenuHeading}>{heading}</p>
            <div style={styles.editorialMenuDescription}>
              {description ? <p className="whitespace-pre-line" style={styles.editorialMenuLine}>{description}</p> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DianaScheduleItem({ item, styles }) {
  const time = item.item_time ?? item.time
  const title = item.item_title ?? item.title
  const description = item.item_description ?? item.description

  return (
    <article style={styles.editorialScheduleItem}>
      <p style={styles.editorialScheduleTime}>{formatScheduleTime(time)}</p>
      <div>
        <h3 style={styles.editorialScheduleTitle}>{title || 'Program'}</h3>
        {description ? <p style={styles.editorialScheduleDescription}>{description}</p> : null}
      </div>
    </article>
  )
}

function getScheduleTimeMinutes(item) {
  const value = item?.item_time ?? item?.time
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/)

  if (!match) {
    return Number.POSITIVE_INFINITY
  }

  return Number(match[1]) * 60 + Number(match[2])
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

function splitCoupleName(value) {
  const normalized = String(value || '').trim()
  if (!normalized) {
    return ['Naša svadba', '']
  }

  const parts = normalized
    .split(/\s*(?:&|\+|\/|\band\b|\ba\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length >= 2) {
    return [parts[0], parts.slice(1).join(' ')]
  }

  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return [words[0], words.slice(1).join(' ')]
  }

  return [normalized, '']
}

function formatCoupleNameLabel(firstPartner, secondPartner) {
  return [firstPartner, secondPartner].filter(Boolean).join(' & ')
}

const CLASSIC_LAYOUT_FAMILIES = new Set([
  'classic',
  'diana',
  'botanique',
  'penelope',
  'charlotte',
  'cate',
  'jewel',
  'isabel',
])

function resolveDesignFamily(value) {
  const normalized = String(value || '').trim().toLowerCase()

  if (normalized === 'editorial') {
    return 'editorial'
  }

  if (normalized === 'romantic') {
    return 'romantic'
  }

  if (CLASSIC_LAYOUT_FAMILIES.has(normalized)) {
    return normalized
  }

  return 'classic'
}

function resolveColorVariant(value) {
  const normalized = String(value || '').trim().toLowerCase()

  if (normalized === 'sage') {
    return 'sage'
  }

  if (normalized === 'blush') {
    return 'blush'
  }

  return 'champagne'
}

function getThemeStyles(designFamily) {
  if (designFamily === 'editorial') {
    return editorialThemeStyles
  }

  if (designFamily === 'diana') {
    return dianaThemeStyles
  }

  if (designFamily === 'romantic') {
    return romanticThemeStyles
  }

  return {}
}

function getColorTheme(colorVariant) {
  return colorThemes[colorVariant] || colorThemes.champagne
}

const colorThemes = {
  champagne: {
    page: {
      color: '#4f4035',
    },
    heroCard: {
      background: 'rgba(255, 250, 244, 0.84)',
      border: '1px solid rgba(138, 111, 84, 0.15)',
      boxShadow: '0 20px 60px rgba(106, 82, 58, 0.12)',
    },
    eyebrow: {
      color: '#9b7c62',
    },
    heroTitle: {
      color: '#3f3128',
    },
    heroMeta: {
      color: '#4f4035',
    },
    heroLocation: {
      color: '#4f4035',
    },
    heroAddress: {
      color: '#6f5b4b',
    },
    button: {
      background: '#5f4838',
      color: '#fffaf5',
      boxShadow: '0 12px 24px rgba(95, 72, 56, 0.18)',
    },
    welcomeText: {
      color: '#6a5444',
    },
  },
  sage: {
    page: {
      color: '#32463f',
    },
    heroCard: {
      background: 'rgba(243, 249, 246, 0.88)',
      border: '1px solid rgba(103, 137, 124, 0.2)',
      boxShadow: '0 20px 60px rgba(71, 104, 91, 0.14)',
    },
    eyebrow: {
      color: '#658779',
    },
    heroTitle: {
      color: '#2f433c',
    },
    heroMeta: {
      color: '#3d564d',
    },
    heroLocation: {
      color: '#3d564d',
    },
    heroAddress: {
      color: '#58766a',
    },
    button: {
      background: '#45675c',
      color: '#f5fbf8',
      boxShadow: '0 12px 24px rgba(69, 103, 92, 0.22)',
    },
    welcomeText: {
      color: '#4f6b61',
    },
  },
  blush: {
    page: {
      color: '#5e3f45',
    },
    heroCard: {
      background: 'rgba(255, 245, 247, 0.9)',
      border: '1px solid rgba(189, 137, 149, 0.2)',
      boxShadow: '0 20px 60px rgba(161, 108, 121, 0.16)',
    },
    eyebrow: {
      color: '#b37685',
    },
    heroTitle: {
      color: '#6a4149',
    },
    heroMeta: {
      color: '#7f5560',
    },
    heroLocation: {
      color: '#7f5560',
    },
    heroAddress: {
      color: '#996974',
    },
    button: {
      background: '#865561',
      color: '#fff7f8',
      boxShadow: '0 12px 24px rgba(134, 85, 97, 0.24)',
    },
    welcomeText: {
      color: '#825864',
    },
  },
}

const dianaSerifFont = dianaContentFont.style.fontFamily
const dianaSectionLabelFont = dianaLabelFont.style.fontFamily
const dianaHeroFontVariants = {
  current: dianaHeroCurrentFont.style.fontFamily,
  brittany: `'Brittany Signature', ${dianaHeroCurrentFont.style.fontFamily}`,
  msmadi: dianaHeroMsMadiFont.style.fontFamily,
}

const dianaHeroNameFontFamily =
  dianaHeroFontVariants[dianaHeroFontVariant] || dianaHeroFontVariants.current

const dianaHeroNameTypography = {
  fontFamily: dianaHeroNameFontFamily,
  fontSize: 'min(6.4rem, 13.8cqw)',
  lineHeight: 0.72,
  fontWeight: 400,
  letterSpacing: '-0.015em',
  transform: 'translateY(-7%)',
}

const dianaThemeStyles = {
  page: {
    backgroundColor: '#f8f2e9',
    backgroundImage:
      'radial-gradient(circle at 14% 8%, rgba(197,165,118,0.14) 0%, rgba(197,165,118,0) 36%), linear-gradient(180deg, #f8f2e9 0%, #fbf7f2 42%, #fffcf8 100%)',
    fontFamily: dianaSerifFont,
  },
  heroSection: {
    width: '100%',
    padding: '0',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f8f2e9',
  },
  heroCard: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: 'none',
    margin: 0,
    padding: 0,
    borderRadius: '0',
    background: 'transparent',
    border: '0',
    boxShadow: 'none',
    overflow: 'visible',
    textAlign: 'center',
  },
  heroBackground: {
    aspectRatio: '1366 / 768',
    backgroundColor: '#f1e7d8',
    backgroundImage: 'url("/templates/diana/diana-hero-bg.png")',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    containerType: 'inline-size',
  },
  heroNameLine: {
    display: 'block',
  },
  heroFirstName: {
    transform: 'translateX(-18%) translateY(-8%)',
  },
  heroSecondName: {
    transform: 'translateX(18%) translateY(calc(8% + 42px))',
  },
  heroAmpersand: {
    display: 'block',
    margin: 'min(0.9rem, 2cqw) 0 min(1rem, 2.2cqw)',
    fontFamily: dianaSerifFont,
    fontSize: '0.36em',
    fontStyle: 'italic',
    fontWeight: 400,
    lineHeight: 0.9,
    textAlign: 'center',
    transform: 'translateY(2%)',
  },
  eyebrow: {
    marginBottom: 'clamp(24px, 5vw, 42px)',
    letterSpacing: '0.32em',
    color: '#9b805c',
    fontFamily: dianaSectionLabelFont,
    fontWeight: 400,
  },
  heroTitle: {
    margin: 0,
    ...dianaHeroNameTypography,
    color: '#704a43',
    textTransform: 'none',
  },
  heroMeta: {
    fontSize: 'clamp(21px, 2.8vw, 30px)',
    color: '#6e5945',
  },
  heroLocation: {
    marginTop: '0',
    color: '#564637',
    fontSize: 'clamp(19px, 2.6vw, 25px)',
    fontWeight: 400,
  },
  heroAddress: {
    color: '#806d59',
    fontSize: 'clamp(15px, 2vw, 18px)',
  },
  button: {
    background: 'transparent',
    color: '#6f5c47',
    border: '1px solid rgba(166, 132, 86, 0.3)',
    boxShadow: 'none',
    borderRadius: '0',
    marginTop: 0,
    marginLeft: '0',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    padding: '9px 16px',
    fontSize: '10px',
    fontWeight: 400,
  },
  welcomeText: { maxWidth: '760px', fontSize: 'clamp(18px, 2.2vw, 24px)', color: '#6f5c49' },
  editorialSection: {
    padding: 'clamp(36px, 7vw, 72px) 0 clamp(72px, 10vw, 118px)',
  },
  editorialBlock: {
    width: 'min(calc(100% - 40px), 920px)',
    maxWidth: 'none',
    margin: '0 auto',
    padding: 'clamp(54px, 8vw, 84px) 0',
    textAlign: 'center',
    borderTop: '1px solid rgba(180, 160, 120, 0.25)',
  },
  editorialBlockFirst: {
    borderTop: '0',
  },
  editorialBlockCompact: {
    padding: 'clamp(10px, 1.8vw, 18px) 0',
  },
  editorialMenuBlock: {
    width: '100%',
    maxWidth: 'none',
    padding: 'clamp(72px, 9vw, 112px) 24px',
    backgroundImage:
      'linear-gradient(rgba(255, 250, 242, 0.85), rgba(255, 250, 242, 0.85)), url("/images/drapery.jpg")',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  },
  editorialSplitBlock: {
    display: 'grid',
    alignItems: 'center',
    width: 'min(100%, 1200px)',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: 0,
    textAlign: 'left',
  },
  editorialCeremonySplitBlock: {
    padding: 0,
  },
  editorialSplitMedia: {
    position: 'relative',
    width: '100%',
    height: 'auto',
    overflow: 'visible',
  },
  editorialMenuMedia: {
    justifySelf: 'start',
    maxWidth: '620px',
  },
  editorialSplitImage: {
    display: 'block',
    width: '100%',
    height: 'auto',
    maxHeight: '85vh',
    objectFit: 'contain',
  },
  editorialMenuImage: {
    width: '118%',
    maxWidth: '118%',
    marginLeft: 0,
    marginRight: 'auto',
  },
  editorialMenuCopy: {
    width: 'min(100%, 460px)',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  editorialCelebrationImage: {
    display: 'block',
    height: 'auto',
    objectFit: 'contain',
  },
  editorialSplitCopy: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 'none',
    minHeight: '100%',
  },
  editorialSplitMeta: {
    margin: '18px 0 0',
    fontSize: 'clamp(32px, 4.4vw, 48px)',
    lineHeight: 1.08,
    fontWeight: 400,
    color: '#4e4134',
    fontFamily: dianaSerifFont,
  },
  editorialEyebrow: {
    margin: '0 0 20px',
    fontSize: 'clamp(12px, 1.2vw, 14px)',
    lineHeight: 1.4,
    letterSpacing: '0.18em',
    textTransform: 'none',
    color: '#9b805c',
    fontFamily: dianaSerifFont,
    fontStyle: 'italic',
    fontVariantCaps: 'small-caps',
    fontWeight: 400,
  },
  editorialTitle: {
    margin: 0,
    fontSize: 'clamp(40px, 5.8vw, 64px)',
    lineHeight: 1.08,
    fontWeight: 400,
    color: '#3f352b',
    fontFamily: dianaSerifFont,
  },
  editorialTitleCompact: {
    fontSize: 'clamp(30px, 4.2vw, 48px)',
  },
  editorialTwoColumnBlock: {
    width: 'min(calc(100% - 40px), 1120px)',
    padding: 'clamp(72px, 9vw, 112px) 0',
    textAlign: 'center',
  },
  editorialTwoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '80px',
    alignItems: 'start',
  },
  editorialTwoColumnItem: {
    display: 'grid',
    justifyItems: 'center',
    minWidth: 0,
    textAlign: 'center',
  },
  editorialColumnTitle: {
    margin: 0,
    fontSize: 'clamp(34px, 4.6vw, 52px)',
    lineHeight: 1.1,
    fontWeight: 400,
    color: '#3f352b',
    fontFamily: dianaSerifFont,
  },
  editorialColumnBody: {
    maxWidth: '420px',
    margin: '24px auto 0',
    fontSize: 'clamp(18px, 2.2vw, 22px)',
    lineHeight: 1.85,
    color: '#5d4d3d',
    fontFamily: dianaSerifFont,
  },
  editorialContent: {
    marginTop: '26px',
  },
  editorialTimingTitle: {
    marginBottom: '36px',
  },
  editorialTimingContent: {
    marginTop: 0,
  },
  editorialTimingSplitCopy: {
    width: 'min(100%, 430px)',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingTop: 0,
    paddingBottom: 0,
    transform: 'translateX(-12px)',
  },
  editorialCelebrationTitle: {
    fontSize: 'clamp(36px, 5.2vw, 58px)',
  },
  editorialCelebrationVenue: {
    maxWidth: '520px',
    margin: '0 auto',
    fontSize: 'clamp(23px, 2.9vw, 31px)',
    lineHeight: 1.32,
    color: '#4e4134',
    fontFamily: dianaSerifFont,
  },
  editorialCelebrationAddress: {
    maxWidth: '520px',
    margin: '4px auto 0',
    fontSize: 'clamp(14px, 1.75vw, 17px)',
    lineHeight: 1.62,
    color: '#7a6854',
    fontFamily: dianaSerifFont,
  },
  editorialTimingVenue: {
    maxWidth: '850px',
    margin: '0 auto',
    fontSize: 'clamp(24px, 3.2vw, 34px)',
    lineHeight: 1.3,
    color: '#4e4134',
    fontFamily: dianaSerifFont,
  },
  editorialTimingAddress: {
    maxWidth: '850px',
    margin: '4px auto 0',
    fontSize: 'clamp(15px, 1.9vw, 18px)',
    lineHeight: 1.65,
    color: '#7a6854',
    fontFamily: dianaSerifFont,
  },
  editorialText: {
    maxWidth: '850px',
    margin: '0 auto',
    fontSize: 'clamp(22px, 3vw, 31px)',
    lineHeight: 1.35,
    color: '#4e4134',
    fontFamily: dianaSerifFont,
  },
  editorialSubText: {
    maxWidth: '850px',
    margin: '8px auto 0',
    fontSize: 'clamp(16px, 2vw, 19px)',
    lineHeight: 1.75,
    color: '#75634f',
    fontFamily: dianaSerifFont,
  },
  editorialBody: {
    maxWidth: '850px',
    margin: '0 auto',
    fontSize: 'clamp(18px, 2.2vw, 22px)',
    lineHeight: 1.85,
    color: '#5d4d3d',
    fontFamily: dianaSerifFont,
    textAlign: 'center',
  },
  editorialMenuText: {
    maxWidth: '850px',
    margin: '0 auto',
    textAlign: 'center',
  },
  editorialMenuCourse: {
    marginTop: '40px',
    paddingTop: '24px',
    borderTop: '1px solid rgba(176, 139, 105, 0.24)',
  },
  editorialMenuCourseFirst: {
    marginTop: 0,
    paddingTop: 0,
    borderTop: 'none',
  },
  editorialMenuHeading: {
    margin: '0 0 9px',
    fontSize: 'clamp(12px, 1.2vw, 14px)',
    lineHeight: 1.4,
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    fontWeight: 500,
    color: '#b08d67',
    fontFamily: dianaSectionLabelFont,
    textAlign: 'center',
  },
  editorialMenuDescription: {
    maxWidth: '850px',
    margin: '0 auto',
  },
  editorialMenuLine: {
    margin: 0,
    fontSize: 'clamp(18px, 2.2vw, 22px)',
    lineHeight: 1.75,
    color: '#5d4d3d',
    fontFamily: dianaSerifFont,
    textAlign: 'center',
  },
  editorialScheduleList: {
    display: 'grid',
    gap: '28px',
    marginTop: '8px',
  },
  editorialScheduleItem: {
    display: 'grid',
    gap: '8px',
    justifyItems: 'center',
  },
  editorialScheduleTime: {
    margin: 0,
    fontSize: '12px',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: '#9b805c',
    fontFamily: dianaSectionLabelFont,
  },
  editorialScheduleTitle: {
    margin: 0,
    fontSize: 'clamp(22px, 3vw, 30px)',
    lineHeight: 1.25,
    fontWeight: 400,
    color: '#42362b',
    fontFamily: dianaSerifFont,
  },
  editorialScheduleDescription: {
    maxWidth: '560px',
    margin: '8px auto 0',
    fontSize: 'clamp(16px, 2vw, 18px)',
    lineHeight: 1.75,
    color: '#6e5c49',
    fontFamily: dianaSerifFont,
  },
  editorialActions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '30px',
  },
  editorialPrimaryAction: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '42px',
    padding: '10px 20px',
    border: '1px solid rgba(126, 96, 58, 0.42)',
    color: '#fffaf2',
    background: '#5f4838',
    textDecoration: 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    fontSize: '10px',
    fontFamily: dianaSectionLabelFont,
  },
  editorialSecondaryAction: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '42px',
    padding: '10px 20px',
    border: '1px solid rgba(180, 160, 120, 0.35)',
    color: '#5f4838',
    background: 'transparent',
    textDecoration: 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    fontSize: '10px',
    fontFamily: dianaSectionLabelFont,
  },
}

const editorialThemeStyles = {
  page: {
    backgroundImage: 'linear-gradient(180deg, #ece7df 0%, #f4efe8 38%, #fbf8f3 100%)',
    color: '#352f2a',
    fontFamily: "'Cormorant Garamond', Georgia, Times New Roman, serif",
  },
  heroSection: {
    padding: '56px 24px 28px',
  },
  heroCard: {
    textAlign: 'left',
    padding: '74px 64px',
    borderRadius: '20px',
    maxWidth: '940px',
  },
  eyebrow: {
    letterSpacing: '0.24em',
  },
  heroTitle: {
    fontSize: 'clamp(48px, 7vw, 84px)',
    margin: '18px 0 10px',
  },
  heroMeta: {
    fontSize: '20px',
    letterSpacing: '0.03em',
  },
  heroLocation: {
    fontSize: '20px',
  },
  heroAddress: {
    fontSize: '17px',
  },
  button: {
    borderRadius: '4px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  welcomeText: {
    fontSize: '20px',
    fontStyle: 'italic',
    color: '#554a41',
  },
}

const romanticThemeStyles = {
  page: {
    backgroundImage: 'linear-gradient(180deg, #f7ede9 0%, #fbf4f0 36%, #fffaf7 100%)',
    color: '#5d4045',
    fontFamily: "'Playfair Display', Georgia, Times New Roman, serif",
  },
  heroSection: {
    padding: '54px 20px 36px',
  },
  heroCard: {
    maxWidth: '820px',
    borderRadius: '40px',
    background: 'rgba(255, 246, 243, 0.9)',
    boxShadow: '0 24px 56px rgba(149, 106, 113, 0.14)',
    border: '1px solid rgba(188, 142, 149, 0.2)',
  },
  eyebrow: {
    color: '#b17582',
    letterSpacing: '0.3em',
  },
  heroTitle: {
    color: '#663f46',
    fontSize: 'clamp(46px, 8vw, 80px)',
  },
  heroMeta: {
    color: '#8b5f67',
  },
  heroLocation: {
    color: '#7a5058',
  },
  heroAddress: {
    color: '#946972',
  },
  button: {
    background: '#7b525a',
    boxShadow: '0 14px 28px rgba(123, 82, 90, 0.2)',
  },
  welcomeText: {
    color: '#7f5860',
  },
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
