/**
 * src/pages/Home.jsx
 *
 * Public landing page. Hero section with results lookup CTA,
 * feature highlights, and a quick stats banner.
 */

import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="page-enter">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)',
          minHeight: '520px',
        }}>
        {/* Decorative circle */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full
          bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full
          bg-white/5 pointer-events-none -translate-x-1/2 translate-y-1/2" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 text-white">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full
              px-4 py-1.5 text-sm font-medium mb-6 text-green-100">
              <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
              Kenya National Examinations Council
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              KCSE Results Portal
            </h1>
            <p className="text-lg text-green-100 mb-10 leading-relaxed">
              Access your Kenya Certificate of Secondary Education results instantly.
              Enter your examination index number and full name — no account needed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/results"
                className="btn btn-accent btn-lg"
                style={{ fontSize: '1rem' }}>
                Check My Results →
              </Link>
              <Link to="/rankings"
                className="btn btn-lg"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.3)',
                  fontSize: '1rem',
                }}>
                School Rankings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '800,000+', label: 'Candidates Registered' },
              { value: '10,000+', label: 'Examination Centres' },
              { value: '47',      label: 'Counties Covered' },
              { value: '2024',    label: 'Current Exam Year' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl sm:text-3xl font-bold text-green-800 mb-1"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  {value}
                </div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3"
            style={{ fontFamily: 'var(--font-display)' }}>
            How to Check Your Results
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Results are available immediately after KNEC publishes them.
            No registration or login is required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Enter Index Number',
              desc: 'Type your 11-digit KNEC examination index number printed on your admission card.',
              color: 'bg-green-50 text-green-800',
            },
            {
              step: '02',
              title: 'Enter Full Name',
              desc: 'Type your full name exactly as it appears on your birth certificate (e.g. GADAFI IMRAN AKIL).',
              color: 'bg-amber-50 text-amber-800',
            },
            {
              step: '03',
              title: 'View & Download',
              desc: 'Your results appear instantly. Download a PDF result slip to print or share.',
              color: 'bg-blue-50 text-blue-800',
            },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="card card-hover">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl
                font-bold text-lg mb-4 ${color}`}
                style={{ fontFamily: 'var(--font-display)' }}>
                {step}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2"
                style={{ fontFamily: 'var(--font-display)' }}>
                {title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/results" className="btn btn-primary btn-lg">
            Check Results Now
          </Link>
        </div>
      </section>

      {/* ── Info strip ───────────────────────────────────────────────────── */}
      <section className="bg-green-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'var(--font-display)' }}>
                About the KCSE Examination
              </h2>
              <p className="text-green-200 text-sm leading-relaxed mb-4">
                The Kenya Certificate of Secondary Education (KCSE) is the national
                examination administered by KNEC at the end of Form 4. It determines
                university admission and certification of secondary education completion.
              </p>
              <p className="text-green-200 text-sm leading-relaxed">
                Results are graded A to E based on performance across compulsory and
                optional subjects. The mean grade is computed from the best 7 subjects.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { grade: 'A',  range: '75–100', colour: '#4ade80' },
                { grade: 'B+', range: '65–69',  colour: '#34d399' },
                { grade: 'C+', range: '50–54',  colour: '#60a5fa' },
                { grade: 'D+', range: '35–39',  colour: '#f97316' },
              ].map(({ grade, range, colour }) => (
                <div key={grade}
                  className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
                  <div className="text-3xl font-bold"
                    style={{ fontFamily: 'var(--font-display)', color: colour }}>
                    {grade}
                  </div>
                  <div>
                    <div className="text-xs text-green-300">Grade</div>
                    <div className="text-sm font-medium">{range} marks</div>
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