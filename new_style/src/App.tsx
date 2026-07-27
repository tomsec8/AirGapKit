import { useState, useEffect, useRef } from 'react'

// ── Icons ────────────────────────────────────────────────────────────────────

function ShieldIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function WifiOffIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function LockIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
    </svg>
  )
}

function FileIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function ImageIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
      <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ZapIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function EyeOffIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function ServerIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2" y="14" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="6" cy="6" r="1" fill="currentColor"/>
      <circle cx="6" cy="18" r="1" fill="currentColor"/>
    </svg>
  )
}

function ChromeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 8h8.93M4.93 15L8.5 8.93M8.5 15.07L12.07 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function FirefoxIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.93V16c-2.76-.55-5-2.79-5-5.5 0-.28.02-.55.05-.82L9 12v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V5.07c2.78.47 5 2.67 5 5.43 0 1.04-.28 2.02-.76 2.89h.66z" fill="currentColor" fillOpacity="0.3"/>
    </svg>
  )
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function GitHubIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
    </svg>
  )
}

// ── Shield Animation ──────────────────────────────────────────────────────────

function ShieldAnimation() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>
      {/* Pulse rings */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: 200 + i * 60,
            height: 200 + i * 60,
            borderColor: `rgba(0, 232, 196, ${0.15 - i * 0.04})`,
            animation: `pulse-ring ${2 + i * 0.5}s ease-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      {/* Main shield container */}
      <div
        className="animate-float relative flex items-center justify-center"
        style={{
          width: 180,
          height: 180,
          background: 'linear-gradient(135deg, #0c1030 0%, #131840 100%)',
          borderRadius: '50%',
          border: '1px solid rgba(0, 232, 196, 0.3)',
          boxShadow: '0 0 60px rgba(0, 232, 196, 0.15), inset 0 0 40px rgba(0, 232, 196, 0.05)',
        }}
      >
        {/* Scan line */}
        <div
          className="absolute inset-0 overflow-hidden rounded-full"
          style={{ opacity: 0.4 }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 2,
              background: 'linear-gradient(90deg, transparent, #00e8c4, transparent)',
              animation: 'scan 2.5s linear infinite',
            }}
          />
        </div>

        <div style={{ color: '#00e8c4' }}>
          <ShieldIcon size={72} />
        </div>
      </div>

      {/* Floating badges */}
      {[
        { label: 'PDF', angle: -30, dist: 130 },
        { label: 'PNG', angle: 30, dist: 130 },
        { label: 'DOCX', angle: 180, dist: 120 },
        { label: 'ZIP', angle: 210, dist: 128 },
        { label: 'MP4', angle: 150, dist: 128 },
      ].map(({ label, angle, dist }) => {
        const rad = (angle * Math.PI) / 180
        const x = Math.cos(rad) * dist
        const y = Math.sin(rad) * dist
        return (
          <div
            key={label}
            className="absolute font-mono text-xs font-medium"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              background: 'rgba(12, 16, 48, 0.9)',
              border: '1px solid rgba(0, 232, 196, 0.25)',
              color: '#00e8c4',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11,
              backdropFilter: 'blur(8px)',
            }}
          >
            {label}
          </div>
        )
      })}
    </div>
  )
}

// ── Feature Card ──────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  desc,
  accent = false,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  accent?: boolean
}) {
  return (
    <div
      className="card-hover rounded-2xl p-6"
      style={{
        background: accent
          ? 'linear-gradient(135deg, rgba(0, 232, 196, 0.08) 0%, rgba(0, 232, 196, 0.02) 100%)'
          : 'rgba(12, 16, 48, 0.6)',
        border: `1px solid ${accent ? 'rgba(0, 232, 196, 0.25)' : 'rgba(255, 255, 255, 0.06)'}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="mb-4 inline-flex items-center justify-center rounded-xl"
        style={{
          width: 48,
          height: 48,
          background: accent ? 'rgba(0, 232, 196, 0.15)' : 'rgba(255, 255, 255, 0.06)',
          color: accent ? '#00e8c4' : '#9aa3cc',
        }}
      >
        {icon}
      </div>
      <h3
        className="font-display font-semibold mb-2"
        style={{ fontSize: 17, color: '#eef1ff' }}
      >
        {title}
      </h3>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: '#6b75a0' }}>{desc}</p>
    </div>
  )
}

// ── Tool Card ─────────────────────────────────────────────────────────────────

function ToolCard({
  label,
  desc,
  color,
  formats,
}: {
  label: string
  desc: string
  color: string
  formats: string[]
}) {
  return (
    <div
      className="card-hover rounded-2xl p-6 flex flex-col gap-4"
      style={{
        background: 'rgba(12, 16, 48, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div>
        <div
          className="font-display font-bold mb-1"
          style={{ fontSize: 18, color }}
        >
          {label}
        </div>
        <p style={{ fontSize: 13, color: '#6b75a0', lineHeight: 1.5 }}>{desc}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {formats.map((f) => (
          <span
            key={f}
            className="font-mono"
            style={{
              fontSize: 11,
              color,
              background: `${color}14`,
              border: `1px solid ${color}30`,
              borderRadius: 5,
              padding: '2px 8px',
            }}
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Step ──────────────────────────────────────────────────────────────────────

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0">
        <div
          className="font-mono font-medium flex items-center justify-center rounded-full"
          style={{
            width: 44,
            height: 44,
            background: 'rgba(0, 232, 196, 0.08)',
            border: '1px solid rgba(0, 232, 196, 0.3)',
            color: '#00e8c4',
            fontSize: 14,
          }}
        >
          {num}
        </div>
      </div>
      <div>
        <h3
          className="font-display font-semibold mb-1"
          style={{ fontSize: 17, color: '#eef1ff' }}
        >
          {title}
        </h3>
        <p style={{ fontSize: 14, color: '#6b75a0', lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  )
}

// ── Stats Counter ─────────────────────────────────────────────────────────────

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div
        className="font-display font-bold shimmer-text"
        style={{ fontSize: 38, lineHeight: 1.1 }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13, color: '#6b75a0', marginTop: 6 }}>{label}</div>
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(7, 9, 26, 0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}
    >
      <div
        className="mx-auto flex items-center justify-between"
        style={{ maxWidth: 1100, padding: '0 24px', height: 64 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, rgba(0,232,196,0.2), rgba(0,232,196,0.05))',
              border: '1px solid rgba(0,232,196,0.3)',
              color: '#00e8c4',
            }}
          >
            <ShieldIcon size={20} />
          </div>
          <span
            className="font-display font-bold"
            style={{ fontSize: 18, color: '#eef1ff' }}
          >
            AirGap<span style={{ color: '#00e8c4' }}>Kit</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            ['תכונות', '#features'],
            ['כלים', '#tools'],
            ['אבטחה', '#security'],
            ['GitHub', '#github'],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              style={{ fontSize: 14, color: '#6b75a0', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#eef1ff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6b75a0')}
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          href="#install"
          className="font-display font-semibold"
          style={{
            fontSize: 13,
            padding: '8px 20px',
            borderRadius: 8,
            background: 'rgba(0, 232, 196, 0.1)',
            border: '1px solid rgba(0, 232, 196, 0.35)',
            color: '#00e8c4',
            transition: 'all 0.2s',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 232, 196, 0.18)'
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0,232,196,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 232, 196, 0.1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          התקן עכשיו
        </a>
      </div>
    </nav>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<'chrome' | 'firefox'>('chrome')

  const features = [
    {
      icon: <WifiOffIcon size={22} />,
      title: 'אפס תעבורת רשת',
      desc: 'כל עיבוד מתרחש ישירות בדפדפן. שום קובץ לא נשלח לשום שרת, לעולם.',
      accent: true,
    },
    {
      icon: <LockIcon size={22} />,
      title: 'הצפנה מקומית',
      desc: 'קבצים מוצפנים ומפוענחים על המחשב שלך בלבד. המפתח לא יוצא מהמכשיר.',
      accent: false,
    },
    {
      icon: <ZapIcon size={22} />,
      title: 'ביצועים מהירים',
      desc: 'WebAssembly ו-Web Workers מבטיחים עיבוד מהיר גם לקבצים גדולים.',
      accent: false,
    },
    {
      icon: <EyeOffIcon size={22} />,
      title: 'אנונימיות מלאה',
      desc: 'ללא כניסה לחשבון, ללא מעקב, ללא עוגיות. פשוט פותחים ומשתמשים.',
      accent: true,
    },
    {
      icon: <FileIcon size={22} />,
      title: 'תמיכה ב-30+ פורמטים',
      desc: 'PDF, DOCX, XLSX, PNG, JPG, ZIP, MP3 ועוד — הכל נפתח ומעובד מקומית.',
      accent: false,
    },
    {
      icon: <ServerIcon size={22} />,
      title: 'קוד פתוח',
      desc: 'כל הקוד פומבי ב-GitHub. בדוק בעצמך שאנחנו עומדים בהבטחות שלנו.',
      accent: false,
    },
  ]

  const tools = [
    {
      label: 'מסמכים',
      desc: 'המר, דחוס, ומזג מסמכים ללא אינטרנט',
      color: '#00e8c4',
      formats: ['PDF', 'DOCX', 'XLSX', 'PPTX', 'ODT'],
    },
    {
      label: 'תמונות',
      desc: 'שנה גודל, המר פורמט, ודחס תמונות בצד הלקוח',
      color: '#7b61ff',
      formats: ['PNG', 'JPG', 'WEBP', 'SVG', 'AVIF', 'GIF'],
    },
    {
      label: 'ארכיונים',
      desc: 'פתח ויצור קבצי ארכיון ב-100% אופליין',
      color: '#f59e0b',
      formats: ['ZIP', 'TAR', 'GZ', '7Z', 'RAR'],
    },
    {
      label: 'מדיה',
      desc: 'חתוך וסנן אודיו/וידאו ישירות בדפדפן',
      color: '#f472b6',
      formats: ['MP4', 'MP3', 'WAV', 'OGG', 'WEBM'],
    },
  ]

  const steps = [
    {
      num: '01',
      title: 'התקן את התוסף',
      desc: 'הוסף את AirGapKit מחנות Chrome Web Store או Firefox Add-ons — חינם לחלוטין.',
    },
    {
      num: '02',
      title: 'גרור קובץ',
      desc: 'גרור קובץ כלשהו לממשק, או לחץ לבחירה. הקובץ נטען לזיכרון המקומי בלבד.',
    },
    {
      num: '03',
      title: 'עבד, הורד, סיים',
      desc: 'האלגוריתם רץ ב-WebAssembly. הקובץ המעובד מורד ישירות למחשב שלך.',
    },
  ]

  const trustItems = [
    'שום שרת לא רואה את הקבצים שלך',
    'ללא רישום חשבון',
    'ללא אחסון נתונים',
    'ללא פרסום ממוקד',
    'קוד פתוח וניתן לבדיקה',
    'תואם GDPR ו-CCPA',
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#07091a' }}>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ paddingTop: 140, paddingBottom: 100 }}
      >
        {/* Grid background */}
        <div className="grid-bg absolute inset-0" />

        {/* Radial glow */}
        <div
          className="absolute"
          style={{
            top: -200,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 800,
            height: 800,
            background: 'radial-gradient(circle, rgba(0,232,196,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          className="relative mx-auto"
          style={{ maxWidth: 1100, padding: '0 24px' }}
        >
          <div
            className="flex flex-col lg:flex-row items-center gap-16"
            style={{ alignItems: 'center' }}
          >
            {/* Text side */}
            <div className="flex-1 text-center lg:text-right">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-6">
                <div
                  className="inline-flex items-center gap-2 font-mono"
                  style={{
                    fontSize: 12,
                    color: '#00e8c4',
                    background: 'rgba(0,232,196,0.08)',
                    border: '1px solid rgba(0,232,196,0.2)',
                    borderRadius: 100,
                    padding: '5px 14px',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#00e8c4',
                      display: 'inline-block',
                      animation: 'blink 1.5s step-end infinite',
                    }}
                  />
                  Zero-Network · Client-Side Only
                </div>
              </div>

              <h1
                className="font-display font-extrabold leading-tight mb-6"
                style={{ fontSize: 'clamp(36px, 6vw, 62px)', color: '#eef1ff' }}
              >
                הקבצים שלך{' '}
                <span className="shimmer-text">לא עוזבים</span>
                <br />
                את המחשב שלך
              </h1>

              <p
                style={{
                  fontSize: 18,
                  color: '#6b75a0',
                  lineHeight: 1.7,
                  maxWidth: 520,
                  marginRight: 'auto',
                  marginLeft: 'auto',
                }}
                className="lg:mr-0 mb-10"
              >
                AirGapKit הוא תוסף דפדפן לעיבוד קבצים, מסמכים ותמונות{' '}
                <strong style={{ color: '#9aa3cc' }}>100% אופליין</strong>. ללא שרתים,
                ללא ענן, ללא פרטיות פגועה.
              </p>

              {/* Browser buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-end">
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '14px 28px',
                    borderRadius: 10,
                    background: '#00e8c4',
                    color: '#07091a',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 15,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 24px rgba(0,232,196,0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,232,196,0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,232,196,0.3)'
                  }}
                >
                  <ChromeIcon size={18} />
                  הוסף ל-Chrome
                </button>

                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '14px 28px',
                    borderRadius: 10,
                    background: 'rgba(12, 16, 48, 0.8)',
                    color: '#eef1ff',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 15,
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                >
                  <FirefoxIcon size={18} />
                  הוסף ל-Firefox
                </button>
              </div>

              {/* Trust note */}
              <p
                className="font-mono mt-5"
                style={{ fontSize: 12, color: '#3d4566' }}
              >
                חינם לחלוטין · קוד פתוח · ללא רישום
              </p>
            </div>

            {/* Shield animation side */}
            <div className="flex-shrink-0">
              <ShieldAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(12,16,48,0.3)', padding: '40px 24px' }}>
        <div className="mx-auto" style={{ maxWidth: 1100 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="30+" label="פורמטי קבצים נתמכים" />
            <StatItem value="0 בייט" label="נתונים לשרת" />
            <StatItem value="100%" label="עיבוד בצד הלקוח" />
            <StatItem value="∞" label="קבצים ללא הגבלה" />
          </div>
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '100px 24px' }}>
        <div className="mx-auto" style={{ maxWidth: 1100 }}>
          <div className="text-center mb-16">
            <div
              className="font-mono mb-3"
              style={{ fontSize: 12, color: '#00e8c4', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              תכונות עיקריות
            </div>
            <h2
              className="font-display font-bold"
              style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: '#eef1ff' }}
            >
              פרטיות בלי פשרות
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section
        style={{
          padding: '80px 24px',
          background: 'rgba(12, 16, 48, 0.35)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="mx-auto" style={{ maxWidth: 1100 }}>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div
                className="font-mono mb-3"
                style={{ fontSize: 12, color: '#00e8c4', letterSpacing: '0.1em', textTransform: 'uppercase' }}
              >
                איך זה עובד
              </div>
              <h2
                className="font-display font-bold mb-10"
                style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#eef1ff' }}
              >
                פשוט כמו שלוש
                <br />
                פעולות
              </h2>
              <div className="flex flex-col gap-8">
                {steps.map((s) => (
                  <Step key={s.num} {...s} />
                ))}
              </div>
            </div>

            {/* Terminal mockup */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#080b1f',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              }}
            >
              {/* Terminal header */}
              <div
                className="flex items-center gap-2 px-4"
                style={{ height: 44, background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
                <span className="font-mono mx-auto" style={{ fontSize: 12, color: '#3d4566' }}>
                  airgapkit — network traffic
                </span>
              </div>
              {/* Terminal body */}
              <div className="p-6 font-mono" style={{ fontSize: 13, lineHeight: 1.9 }}>
                <div style={{ color: '#3d4566' }}># Network requests while processing document.pdf</div>
                <div style={{ color: '#4a5270' }}>$ curl -I https://airgapkit.local</div>
                <div style={{ color: '#00e8c4' }}>
                  <span style={{ color: '#28c840' }}>✓</span> No outbound connections detected
                </div>
                <div style={{ color: '#4a5270', marginTop: 8 }}># Memory usage</div>
                <div style={{ color: '#eef1ff' }}>
                  RAM: <span style={{ color: '#00e8c4' }}>247 MB</span> &nbsp;|&nbsp; Disk writes:{' '}
                  <span style={{ color: '#00e8c4' }}>0</span>
                </div>
                <div style={{ color: '#4a5270', marginTop: 8 }}># Processed files</div>
                <div style={{ color: '#eef1ff' }}>
                  document.pdf →{' '}
                  <span style={{ color: '#00e8c4' }}>document_compressed.pdf</span>
                </div>
                <div style={{ color: '#4a5270' }}>Size: 12.4 MB → 3.1 MB (75% reduction)</div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ color: '#28c840' }}>✓</span>{' '}
                  <span style={{ color: '#6b75a0' }}>Complete. Zero bytes transmitted.</span>
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 15,
                    background: '#00e8c4',
                    marginTop: 4,
                    animation: 'blink 1s step-end infinite',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tools ────────────────────────────────────────────────── */}
      <section id="tools" style={{ padding: '100px 24px' }}>
        <div className="mx-auto" style={{ maxWidth: 1100 }}>
          <div className="text-center mb-16">
            <div
              className="font-mono mb-3"
              style={{ fontSize: 12, color: '#00e8c4', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              ארסנל הכלים
            </div>
            <h2
              className="font-display font-bold"
              style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: '#eef1ff' }}
            >
              כל פורמט. כל קובץ.
              <br />
              <span style={{ color: '#6b75a0' }}>אופליין לגמרי.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tools.map((t) => (
              <ToolCard key={t.label} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Security / Trust ─────────────────────────────────────── */}
      <section
        id="security"
        style={{
          padding: '80px 24px',
          background: 'rgba(12,16,48,0.35)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="mx-auto" style={{ maxWidth: 900 }}>
          <div
            className="rounded-3xl p-10 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(0,232,196,0.06) 0%, rgba(123,97,255,0.04) 100%)',
              border: '1px solid rgba(0,232,196,0.15)',
            }}
          >
            <div
              className="inline-flex items-center justify-center rounded-2xl mb-6"
              style={{
                width: 64,
                height: 64,
                background: 'rgba(0,232,196,0.08)',
                border: '1px solid rgba(0,232,196,0.2)',
                color: '#00e8c4',
              }}
            >
              <ShieldIcon size={30} />
            </div>

            <h2
              className="font-display font-bold mb-4"
              style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', color: '#eef1ff' }}
            >
              ההבטחה שלנו לפרטיות שלך
            </h2>
            <p style={{ fontSize: 16, color: '#6b75a0', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px' }}>
              לא רק מילים — קוד פתוח שאפשר לבדוק. AirGapKit בנוי מהיסוד
              על עקרון שהקבצים שלך שייכים לך בלבד.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-right">
              {trustItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3"
                  style={{ direction: 'rtl' }}
                >
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{
                      width: 24,
                      height: 24,
                      background: 'rgba(0,232,196,0.1)',
                      color: '#00e8c4',
                    }}
                  >
                    <CheckIcon size={13} />
                  </div>
                  <span style={{ fontSize: 14, color: '#9aa3cc' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section id="install" style={{ padding: '100px 24px' }}>
        <div className="mx-auto text-center" style={{ maxWidth: 700 }}>
          <div
            className="font-mono mb-4"
            style={{ fontSize: 12, color: '#00e8c4', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            התקנה חינמית
          </div>
          <h2
            className="font-display font-extrabold mb-5"
            style={{ fontSize: 'clamp(30px, 5vw, 52px)', color: '#eef1ff', lineHeight: 1.15 }}
          >
            מוכן לפרטיות
            <br />
            <span className="shimmer-text">ברמה אחרת?</span>
          </h2>
          <p style={{ fontSize: 17, color: '#6b75a0', lineHeight: 1.7, marginBottom: 40 }}>
            הוסף את AirGapKit לדפדפן שלך עכשיו. בחינם, קוד פתוח,
            ועובד מיידית — בלי הרשמה, בלי כרטיס אשראי.
          </p>

          {/* Tab selector */}
          <div
            className="inline-flex rounded-xl p-1 mb-8"
            style={{ background: 'rgba(12,16,48,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {(['chrome', 'firefox'] as const).map((browser) => (
              <button
                key={browser}
                onClick={() => setActiveTab(browser)}
                className="flex items-center gap-2 font-display font-semibold"
                style={{
                  padding: '8px 20px',
                  borderRadius: 9,
                  fontSize: 14,
                  background: activeTab === browser ? 'rgba(0,232,196,0.1)' : 'transparent',
                  border: activeTab === browser ? '1px solid rgba(0,232,196,0.25)' : '1px solid transparent',
                  color: activeTab === browser ? '#00e8c4' : '#6b75a0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {browser === 'chrome' ? <ChromeIcon /> : <FirefoxIcon />}
                {browser === 'chrome' ? 'Chrome' : 'Firefox'}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '16px 36px',
                borderRadius: 12,
                background: '#00e8c4',
                color: '#07091a',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 32px rgba(0,232,196,0.35)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 48px rgba(0,232,196,0.45)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = '0 4px 32px rgba(0,232,196,0.35)'
              }}
            >
              {activeTab === 'chrome' ? <ChromeIcon size={20} /> : <FirefoxIcon size={20} />}
              הוסף ל-{activeTab === 'chrome' ? 'Chrome' : 'Firefox'} — חינם
            </button>

            <a
              href="https://github.com"
              id="github"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '16px 28px',
                borderRadius: 12,
                background: 'rgba(12,16,48,0.8)',
                color: '#9aa3cc',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600,
                fontSize: 16,
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'
                e.currentTarget.style.color = '#eef1ff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = '#9aa3cc'
              }}
            >
              <GitHubIcon size={20} />
              קוד מקור ב-GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '40px 24px',
          background: 'rgba(5,7,18,0.8)',
        }}
      >
        <div
          className="mx-auto flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ maxWidth: 1100 }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: 30,
                height: 30,
                background: 'rgba(0,232,196,0.1)',
                border: '1px solid rgba(0,232,196,0.2)',
                color: '#00e8c4',
              }}
            >
              <ShieldIcon size={16} />
            </div>
            <span
              className="font-display font-bold"
              style={{ fontSize: 15, color: '#eef1ff' }}
            >
              AirGap<span style={{ color: '#00e8c4' }}>Kit</span>
            </span>
          </div>

          <p className="font-mono text-center" style={{ fontSize: 12, color: '#3d4566' }}>
            © 2024 AirGapKit · MIT License · Zero-Network · Client-Side Only
          </p>

          <div className="flex gap-6">
            {['פרטיות', 'תנאי שימוש', 'GitHub'].map((link) => (
              <a
                key={link}
                href="#"
                style={{ fontSize: 13, color: '#3d4566', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#6b75a0')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#3d4566')}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
