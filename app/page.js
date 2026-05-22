import supabase from '../lib/supabase'

export default async function Home() {
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', 'diana-anton')
    .single()

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f8f4ef',
        color: '#3a312b',
        padding: '60px 20px',
        textAlign: 'center',
        fontFamily: 'serif',
      }}
    >
      <h1 style={{ fontSize: '56px' }}>{project.couple_display_name}</h1>
      <p style={{ fontSize: '22px' }}>{project.wedding_date}</p>
      <p style={{ fontSize: '20px' }}>
        {project.venue_name}, {project.venue_address}
      </p>
    </main>
  )
}