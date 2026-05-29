/**
 * src/pages/Home.jsx
 *
 * Public landing page. Hero section with results lookup CTA,
 * feature highlights, and a quick stats banner.
 */

import { Link } from 'react-router-dom'

/* ── Step card data ───────────────────────────────────────────────────────── */
const HOW_STEPS = [
  {
    step:  '01',
    title: 'Enter Index Number',
    desc:  'Type your 11-digit KNEC examination index number printed on your admission card.',
    iconBg: 'var(--color-primary-50)',
    iconColor: 'var(--color-primary-800)',
  },
  {
    step:  '02',
    title: 'Enter Full Name',
    desc:  'Type your full name exactly as it appears on your birth certificate (e.g. GADAFI IMRAN AKIL).',
    iconBg: 'var(--color-warning-bg)',
    iconColor: 'var(--color-accent-700)',
  },
  {
    step:  '03',
    title: 'View & Download',
    desc:  'Your results appear instantly. Download a PDF result slip to print or share.',
    iconBg: 'var(--color-info-bg)',
    iconColor: 'var(--color-info)',
  },
]

const STATS = [
  { value: '800,000+', label: 'Candidates Registered' },
  { value: '10,000+',  label: 'Examination Centres'   },
  { value: '47',       label: 'Counties Covered'       },
  { value: '2024',     label: 'Current Exam Year'      },
]

const GRADE_SAMPLES = [
  { grade: 'A',  range: '75–100', colour: 'var(--color-primary-400)'  },
  { grade: 'B+', range: '65–69',  colour: 'var(--color-primary-300)'  },
  { grade: 'C+', range: '50–54',  colour: 'var(--color-info)'         },
  { grade: 'D+', range: '35–39',  colour: 'var(--color-accent)'       },
]

export default function Home() {
  return (
    <div className="page-enter">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="hero">
        {/* Decorative orbs — handled by .hero::before / ::after in CSS */}

        <div className="container hero-content" style={{ textAlign: 'left' }}>
          <div style={{ maxWidth: '640px' }}>

            {/* Badge */}
            <div className="hero-badge">
              <span style={{
                width: '8px', height: '8px',
                background: 'var(--color-primary-300)',
                borderRadius: 'var(--radius-pill)',
                display: 'inline-block',
                animation: 'pulse-ring 1.5s ease-out infinite',
              }} />
              Kenya National Examinations Council
            </div>

            <h1 className="hero-title">KCSE Results Portal</h1>

            <p className="hero-subtitle" style={{ margin: '0 0 var(--space-10)' }}>
              Access your Kenya Certificate of Secondary Education results instantly.
              Enter your examination index number and full name — no account needed.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/results" className="btn btn-accent btn-lg">
                Check My Results →
              </Link>
              <Link to="/rankings" className="btn btn-lg" style={{
                background:   'rgba(255,255,255,0.15)',
                color:        '#fff',
                borderColor:  'rgba(255,255,255,0.3)',
              }}>
                School Rankings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="bg-white border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div className="stat-value text-primary" style={{ marginBottom: 'var(--space-1)' }}>
                  {value}
                </div>
                <div className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section style={{ padding: 'var(--space-16) 0' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: 'var(--space-12)' }}>
            <h2 style={{ marginBottom: 'var(--space-3)' }}>How to Check Your Results</h2>
            <p className="text-muted" style={{ maxWidth: '520px', margin: '0 auto' }}>
              Results are available immediately after KNEC publishes them.
              No registration or login is required.
            </p>
          </div>

          <div className="auto-grid-md gap-8">
            {HOW_STEPS.map(({ step, title, desc, iconBg, iconColor }) => (
              <div key={step} className="card card-hover">
                {/* Step number pill */}
                <div style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  width:          '3rem',
                  height:         '3rem',
                  borderRadius:   'var(--radius-xl)',
                  background:     iconBg,
                  color:          iconColor,
                  fontFamily:     'var(--font-display)',
                  fontWeight:     700,
                  fontSize:       'var(--text-lg)',
                  marginBottom:   'var(--space-4)',
                }}>
                  {step}
                </div>

                <h3 style={{ marginBottom: 'var(--space-2)' }}>{title}</h3>
                <p className="text-muted" style={{ fontSize: 'var(--text-sm)', marginBottom: 0 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center" style={{ marginTop: 'var(--space-10)' }}>
            <Link to="/results" className="btn btn-primary btn-lg">
              Check Results Now
            </Link>
          </div>
        </div>
      </section>

      {/* ── Info strip ────────────────────────────────────────────────────── */}
      <section style={{
        background: 'var(--color-primary-900)',
        color:      '#fff',
        padding:    'var(--space-16) 0',
      }}>
        <div className="container">
          <div className="grid md:grid-cols-2 gap-10 items-center">

            {/* Text side */}
            <div>
              <h2 style={{
                fontFamily:    'var(--font-display)',
                color:         '#fff',
                marginBottom:  'var(--space-4)',
              }}>
                About the KCSE Examination
              </h2>
              <p style={{
                color:        'var(--color-primary-200)',
                fontSize:     'var(--text-sm)',
                lineHeight:   1.8,
                marginBottom: 'var(--space-4)',
              }}>
                The Kenya Certificate of Secondary Education (KCSE) is the national
                examination administered by KNEC at the end of Form 4. It determines
                university admission and certification of secondary education completion.
              </p>
              <p style={{
                color:      'var(--color-primary-200)',
                fontSize:   'var(--text-sm)',
                lineHeight: 1.8,
                marginBottom: 0,
              }}>
                Results are graded A to E based on performance across compulsory and
                optional subjects. The mean grade is computed from the best 7 subjects.
              </p>
            </div>

            {/* Grade sample grid */}
            <div className="grid grid-cols-2 gap-4">
              {GRADE_SAMPLES.map(({ grade, range, colour }) => (
                <div key={grade} style={{
                  background:   'rgba(255,255,255,0.08)',
                  border:       '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-xl)',
                  padding:      'var(--space-4)',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          'var(--space-3)',
                }}>
                  <div className="grade-display" style={{
                    fontSize: 'var(--text-4xl)',
                    color:    colour,
                  }}>
                    {grade}
                  </div>
                  <div>
                    <div className="label" style={{ color: 'var(--color-primary-300)' }}>
                      Grade
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: '#fff' }}>
                      {range} marks
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}