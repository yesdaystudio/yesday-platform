'use client'

import { useState } from 'react'

export default function DemoRsvp({ onSubmit }) {
  const [attending, setAttending] = useState('yes')
  const [people, setPeople] = useState([{ name: '', type: 'adult', menu: 'meat', allergies: '' }])
  const [name, setName] = useState('')
  const [accommodation, setAccommodation] = useState(false)
  const [transport, setTransport] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  function update(index, key, value) { setPeople(current => current.map((person, i) => i === index ? { ...person, [key]: value } : person)) }
  function submit(event) {
    event.preventDefault()
    const guests = attending === 'yes' ? people : []
    onSubmit({ id: `demo-${crypto.randomUUID()}`, guest_name: attending === 'yes' ? people[0].name.trim() : name.trim(), attending, adults_count: guests.filter(p => p.type === 'adult').length, children_count: guests.filter(p => p.type === 'child').length, people: guests, needs_accommodation: attending === 'yes' && accommodation, transport: attending === 'yes' ? transport : '', contact_email: email, contact_phone: phone, message, created_at: new Date().toISOString() })
  }
  return <form id="demo-rsvp" onSubmit={submit}>
    <h2>Vyskúšajte odpoveď hosťa</h2>
    <p>Po odoslaní uvidíte odpoveď v dashboarde, v zozname hostí aj medzi požiadavkami na ubytovanie.</p>
    <label>Účasť<select value={attending} onChange={e => setAttending(e.target.value)}><option value="yes">Áno, prídeme</option><option value="no">Nie, nemôžeme prísť</option></select></label>
    {attending === 'no' ? <label>Meno hosťa<input required value={name} onChange={e => setName(e.target.value)} /></label> : <>
      <p>Dospelí: {people.filter(p => p.type === 'adult').length} · Deti: {people.filter(p => p.type === 'child').length}</p>
      {people.map((person, index) => <fieldset key={index}><legend>Hosť {index + 1}</legend>
        <label>Meno<input required maxLength={80} value={person.name} onChange={e => update(index, 'name', e.target.value)} /></label>
        <label>Dospelý / dieťa<select value={person.type} onChange={e => { update(index, 'type', e.target.value); update(index, 'menu', e.target.value === 'child' ? 'child' : 'meat') }}><option value="adult">Dospelý</option><option value="child">Dieťa</option></select></label>
        <label>Menu<select value={person.menu} onChange={e => update(index, 'menu', e.target.value)}><option value="meat">Mäsové</option><option value="vegetarian">Vegetariánske</option><option value="vegan">Vegánske</option><option value="child">Detské</option><option value="other">Iné</option></select></label>
        <label>Alergie<input maxLength={240} value={person.allergies} onChange={e => update(index, 'allergies', e.target.value)} placeholder="Napr. orechy, lepok" /></label>
        {people.length > 1 && <button type="button" onClick={() => setPeople(current => current.filter((_, i) => i !== index))}>Odstrániť hosťa</button>}
      </fieldset>)}
      <button type="button" disabled={people.length >= 20} onClick={() => setPeople(current => [...current, { name: '', type: 'adult', menu: 'meat', allergies: '' }])}>+ Pridať hosťa</button>
      <label><span><input type="checkbox" checked={accommodation} onChange={e => setAccommodation(e.target.checked)} /> Potrebujeme ubytovanie</span></label>
      <label>Požiadavka na dopravu<input value={transport} maxLength={240} onChange={e => setTransport(e.target.value)} placeholder="Napr. odvoz pre 3 osoby o 01:00" /></label>
      <label>Kontaktný e-mail<input type="email" required={accommodation} value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Telefón<input type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></label>
    </>}
    <label>Správa pre snúbencov<textarea value={message} maxLength={1000} onChange={e => setMessage(e.target.value)} /></label>
    <button type="submit">Odoslať ukážkové RSVP</button>
  </form>
}
