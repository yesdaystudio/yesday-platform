'use client'

import { useEffect, useState } from 'react'

export default function DianaStickyHeader({ rsvpHref }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > window.innerHeight * 0.75)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return (
    <header className={`dianaStickyHeader${isVisible ? ' isVisible' : ''}`}>
      <div className="dianaStickyHeader__inner">
        <a className="dianaStickyHeader__name" href="#top" aria-label="Diana a Anton">
          Diana a Anton
        </a>
        <nav className="dianaStickyHeader__nav" aria-label="Diana wedding navigation">
          <a href="#info">O nás</a>
          <a href="#program">Program</a>
          <a href={rsvpHref}>RSVP</a>
        </nav>
      </div>

      <style jsx>{`
        .dianaStickyHeader {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 60px;
          overflow: hidden;
          color: #fffaf2;
          background: rgba(80, 65, 55, 0.48);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          opacity: 0;
          pointer-events: none;
          transform: translateY(-100%);
          transition: opacity 220ms ease, transform 220ms ease;
        }

        .dianaStickyHeader::before,
        .dianaStickyHeader::after {
          content: '';
          position: absolute;
          inset: 0;
        }

        .dianaStickyHeader::before {
          background-image: url('/templates/diana/diana-hero-bg.png');
          background-position: center 40%;
          background-repeat: no-repeat;
          background-size: cover;
          filter: blur(12px) saturate(0.86) brightness(1.04);
          opacity: 0.28;
          transform: scale(1.08);
        }

        .dianaStickyHeader::after {
          background:
            linear-gradient(180deg, rgba(255, 250, 242, 0.12), rgba(255, 250, 242, 0.03)),
            rgba(80, 65, 55, 0.22);
          border-bottom: 1px solid rgba(255, 250, 242, 0.16);
        }

        .dianaStickyHeader.isVisible {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }

        .dianaStickyHeader__inner {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: min(100% - 36px, 1120px);
          height: 100%;
          margin: 0 auto;
        }

        .dianaStickyHeader__name,
        .dianaStickyHeader__nav a {
          color: inherit;
          text-decoration: none;
        }

        .dianaStickyHeader__name {
          font-family: inherit;
          font-size: 26px;
          line-height: 1;
          font-weight: 400;
          color: #fffaf2;
        }

        .dianaStickyHeader__nav {
          display: flex;
          align-items: center;
          gap: 18px;
          font-family: inherit;
          font-size: 12px;
          line-height: 1;
          font-weight: 400;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        @media (max-width: 640px) {
          .dianaStickyHeader {
            height: 54px;
          }

          .dianaStickyHeader__inner {
            width: calc(100% - 24px);
          }

          .dianaStickyHeader__name {
            font-size: 20px;
          }

          .dianaStickyHeader__nav {
            gap: 12px;
            font-size: 9px;
            letter-spacing: 0.11em;
          }
        }
      `}</style>
    </header>
  )
}
