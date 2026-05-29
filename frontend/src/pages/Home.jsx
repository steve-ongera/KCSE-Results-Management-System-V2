/**
 * src/pages/Home.jsx
 *
 * Public landing page for KCSE Results Portal.
 * Features: Hero section, results lookup CTA, statistics banner,
 * step-by-step guide, SEO-optimized content, and exam information.
 * 
 * Design: Clean, professional, minimal border radius, Bootstrap Icons.
 */

import { Link } from 'react-router-dom'

// Import images (place these images in your assets folder)
// Replace these with your actual image paths
import heroImage from '../assets/hero-students.jpg'
import stepSearch from '../assets/step-search.svg'
import stepEnter from '../assets/step-enter.svg'
import stepResults from '../assets/step-results.svg'
import studentsImage from '../assets/students-studying.jpg'
import examHallImage from '../assets/exam-hall.jpg'

// Unsplash image URLs (professional, high-quality, free to use)
// Replace with your own images when ready
const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1400&h=600&fit=crop',
  step1: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop',
  step2: 'https://images.unsplash.com/photo-1554224154-26032ffc0c07?w=400&h=300&fit=crop',
  step3: 'https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=400&h=300&fit=crop',
  students: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=400&fit=crop',
  exam: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop',
  certificate: 'https://images.unsplash.com/photo-1588516903720-8ceb67f9ef84?w=400&h=250&fit=crop',
}

/* ── Step card data ───────────────────────────────────────────────────────── */
const HOW_STEPS = [
  {
    step:  '01',
    title: 'Enter Index Number',
    desc:  'Type your 11-digit KNEC examination index number printed on your admission card.',
    icon: 'bi-serial-port',
    image: IMAGES.step1,
  },
  {
    step:  '02',
    title: 'Enter Full Name',
    desc:  'Type your full name exactly as it appears on your birth certificate.',
    icon: 'bi-person-badge',
    image: IMAGES.step2,
  },
  {
    step:  '03',
    title: 'View & Download',
    desc:  'Your results appear instantly. Download a PDF result slip to print or share.',
    icon: 'bi-file-pdf',
    image: IMAGES.step3,
  },
]

const STATS = [
  { value: '800,000+', label: 'Candidates', description: 'registered annually' },
  { value: '10,000+',  label: 'Centres', description: 'examination centers' },
  { value: '47',       label: 'Counties', description: 'covering all of Kenya' },
  { value: '98%',      label: 'Accuracy', description: 'verified results' },
]

const GRADE_SAMPLES = [
  { grade: 'A',  range: '75–100', description: 'Excellent' },
  { grade: 'B+', range: '65–69',  description: 'Very Good' },
  { grade: 'C+', range: '50–54',  description: 'University Entry' },
  { grade: 'D+', range: '35–39',  description: 'Pass' },
]

const FEATURE_ARTICLES = [
  {
    title: 'Understanding KCSE Grading',
    content: 'The KCSE uses a 12-point grading scale from A to E. University admission typically requires a minimum mean grade of C+.',
    image: IMAGES.certificate,
    link: '#',
  },
  {
    title: 'Exam Registration Process',
    content: 'Schools register candidates online through the KNEC portal. Ensure your details match your birth certificate.',
    image: IMAGES.students,
    link: '#',
  },
  {
    title: 'Result Verification',
    content: 'Employers and universities can verify results directly through our secure portal using the candidate\'s index number.',
    image: IMAGES.exam,
    link: '#',
  },
]

export default function Home() {
  return (
    <div className="home-page">

      {/* ── Hero Section with Background Image ────────────────────────────── */}
      <section className="home-hero" style={{ backgroundImage: `url(${IMAGES.hero})` }}>
        <div className="home-hero-overlay"></div>
        <div className="container home-hero-container">
          <div className="home-hero-content">
            <div className="home-hero-badge">
              <i className="bi bi-shield-check"></i>
              <span>Kenya National Examinations Council</span>
            </div>
            <h1 className="home-hero-title">KCSE Results Portal</h1>
            <p className="home-hero-subtitle">
              Access your Kenya Certificate of Secondary Education results instantly.
              Enter your examination index number and full name — no account needed.
            </p>
            <div className="home-hero-buttons">
              <Link to="/results" className="btn btn-primary btn-lg">
                <i className="bi bi-search"></i>
                Check My Results
              </Link>
              <Link to="/rankings" className="btn btn-outline btn-lg btn-white-transparent">
                <i className="bi bi-trophy"></i>
                School Rankings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Statistics Banner ──────────────────────────────────────────────── */}
      <section className="home-stats">
        <div className="container">
          <div className="home-stats-grid">
            {STATS.map(({ value, label, description }) => (
              <div key={label} className="home-stat">
                <div className="home-stat-value">{value}</div>
                <div className="home-stat-label">{label}</div>
                <div className="home-stat-desc">{description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works Section with Images ───────────────────────────────── */}
      <section className="home-how-it-works">
        <div className="container">
          <div className="home-section-header">
            <h2>How to Check Your Results</h2>
            <p>
              Results are available immediately after KNEC publishes them.
              No registration or login is required.
            </p>
          </div>

          <div className="home-steps-grid">
            {HOW_STEPS.map(({ step, title, desc, icon, image }) => (
              <div key={step} className="home-step-card">
                <div className="home-step-image">
                  <img src={image} alt={title} loading="lazy" />
                  <div className="home-step-number">{step}</div>
                </div>
                <div className="home-step-icon">
                  <i className={`${icon}`}></i>
                </div>
                <h3 className="home-step-title">{title}</h3>
                <p className="home-step-desc">{desc}</p>
              </div>
            ))}
          </div>

          <div className="home-steps-cta">
            <Link to="/results" className="btn btn-primary btn-lg">
              <i className="bi bi-search"></i>
              Check Results Now
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature Grid with Images ───────────────────────────────────────── */}
      <section className="home-features">
        <div className="container">
          <div className="home-section-header">
            <h2>Why Use Our Portal?</h2>
            <p>
              Official KCSE results directly from KNEC, available instantly and completely free.
            </p>
          </div>

          <div className="home-features-grid">
            <div className="home-feature">
              <div className="home-feature-icon">
                <i className="bi bi-lightning-charge"></i>
              </div>
              <h3 className="home-feature-title">Instant Access</h3>
              <p className="home-feature-desc">
                Get your results immediately after KNEC publishes them. No waiting, no delays.
              </p>
            </div>

            <div className="home-feature">
              <div className="home-feature-icon">
                <i className="bi bi-shield-check"></i>
              </div>
              <h3 className="home-feature-title">Official Results</h3>
              <p className="home-feature-desc">
                Directly from KNEC's secure database. Authentic and verifiable.
              </p>
            </div>

            <div className="home-feature">
              <div className="home-feature-icon">
                <i className="bi bi-download"></i>
              </div>
              <h3 className="home-feature-title">Download Slip</h3>
              <p className="home-feature-desc">
                Save your results as PDF for printing, sharing, or university applications.
              </p>
            </div>

            <div className="home-feature">
              <div className="home-feature-icon">
                <i className="bi bi-bar-chart-steps"></i>
              </div>
              <h3 className="home-feature-title">School Rankings</h3>
              <p className="home-feature-desc">
                Compare performance across schools and track national trends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── About KCSE Section with Image ──────────────────────────────────── */}
      <section className="home-about">
        <div className="container">
          <div className="home-about-grid">
            <div className="home-about-content">
              <h2>About the KCSE Examination</h2>
              <p>
                The Kenya Certificate of Secondary Education (KCSE) is the national
                examination administered by KNEC at the end of Form 4. It determines
                university admission and certification of secondary education completion.
              </p>
              <p>
                Results are graded A to E based on performance across compulsory and
                optional subjects. The mean grade is computed from the best 7 subjects.
              </p>
              <div className="home-about-stats">
                <div>
                  <span className="home-about-stat-number">8</span>
                  <span className="home-about-stat-label">Compulsory Subjects</span>
                </div>
                <div>
                  <span className="home-about-stat-number">7</span>
                  <span className="home-about-stat-label">Best Count for Mean Grade</span>
                </div>
              </div>
            </div>
            <div className="home-about-image">
              <img src={IMAGES.exam} alt="KCSE Examination Hall" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Grade Scale Reference ──────────────────────────────────────────── */}
      <section className="home-grade-scale">
        <div className="container">
          <div className="home-section-header">
            <h2>KCSE Grading Scale</h2>
            <p>
              Understanding your grade: from A (excellent) to E (fail)
            </p>
          </div>

          <div className="home-grade-grid">
            {GRADE_SAMPLES.map(({ grade, range, description }) => (
              <div key={grade} className="home-grade-item">
                <div className="home-grade-letter">{grade}</div>
                <div className="home-grade-range">{range}</div>
                <div className="home-grade-desc">{description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO Content Articles ───────────────────────────────────────────── */}
      <section className="home-articles">
        <div className="container">
          <div className="home-section-header">
            <h2>Latest Updates & Information</h2>
            <p>
              Stay informed about KCSE examinations, results, and educational news
            </p>
          </div>

          <div className="home-articles-grid">
            {FEATURE_ARTICLES.map((article, index) => (
              <div key={index} className="home-article-card">
                <div className="home-article-image">
                  <img src={article.image} alt={article.title} loading="lazy" />
                </div>
                <div className="home-article-content">
                  <h3 className="home-article-title">{article.title}</h3>
                  <p className="home-article-desc">{article.content}</p>
                  <Link to={article.link} className="home-article-link">
                    Read More <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call to Action ──────────────────────────────────────────────────── */}
      <section className="home-cta">
        <div className="container">
          <div className="home-cta-content">
            <h2>Ready to Check Your Results?</h2>
            <p>
              Access your KCSE results now — fast, secure, and official.
            </p>
            <Link to="/results" className="btn btn-primary btn-lg">
              <i className="bi bi-search"></i>
              Check Your Results
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}