import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import styles from './login.module.css';

export const metadata = {
  title: 'Sign in — P7VC CRM',
};

function isTokenValid(token: string): boolean {
  if (!token || token.split('.').length !== 3) return false;
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'),
    ) as { exp?: number };
    // If exp is missing (some Auth0 tokens omit it), treat token as valid
    if (typeof payload.exp !== 'number') return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    // Token exists but can't be decoded — still came through Auth0, let it through
    return true;
  }
}

export default function LoginPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('p7vc_access_token')?.value;
  if (token && isTokenValid(token)) {
    redirect('/dashboard');
  }

  return (
    <div className={styles.container}>
      {/* ── Brand panel ── */}
      <aside className={styles.brand}>
        <div className={styles.brandLogo}>
          <div className={styles.logoMark}>
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10 2L3 6v8l7 4 7-4V6l-7-4z"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M10 2v12M3 6l7 4 7-4" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <span className={styles.logoText}>P7VC CRM</span>
        </div>

        <h1 className={styles.brandHeadline}>
          Close deals faster.<br />
          <span>Intelligence-first</span> CRM.
        </h1>
        <p className={styles.brandSubline}>
          Relationship graph, AI-enriched pipeline tracking, and real-time
          portfolio analytics — built for P7VC.
        </p>

        <ul className={styles.features} role="list">
          <li className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  d="M7 1a6 6 0 1 0 0 12A6 6 0 0 0 7 1zm.75 3.25a.75.75 0 0 0-1.5 0v3c0 .199.079.39.22.53l2 2a.75.75 0 0 0 1.06-1.06L7.75 7.189V4.25z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className={styles.featureText}>
              <strong>Pipeline Kanban</strong>
              <span>Drag-and-drop deal stages with real-time sync</span>
            </div>
          </li>

          <li className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 4a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm6 0a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM0 10c0-1.657 1.79-3 4-3s4 1.343 4 3v.5a.5.5 0 0 1-.5.5H.5a.5.5 0 0 1-.5-.5V10zm8.764-1.473C9.46 8.196 10.18 8 11 8c2.21 0 4 1.343 4 3v.5a.5.5 0 0 1-.5.5H12v-2c0-.768-.295-1.49-.78-2.073l-.456.1z" />
              </svg>
            </div>
            <div className={styles.featureText}>
              <strong>Relationship Intelligence</strong>
              <span>Graph-powered company and contact mapping</span>
            </div>
          </li>

          <li className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  d="M1 2.5A1.5 1.5 0 0 1 2.5 1h9A1.5 1.5 0 0 1 13 2.5v9A1.5 1.5 0 0 1 11.5 13h-9A1.5 1.5 0 0 1 1 11.5v-9zm2 2a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1H3zm0 2.5a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H3zm0 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className={styles.featureText}>
              <strong>AI-Enriched Profiles</strong>
              <span>Automatic company data enrichment with audit trail</span>
            </div>
          </li>

          <li className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 9.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-.5-.5zm3-2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0V8a.5.5 0 0 0-.5-.5zm3-2.5a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-.5-.5zm3-2a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 1 0v-8a.5.5 0 0 0-.5-.5z" />
              </svg>
            </div>
            <div className={styles.featureText}>
              <strong>Portfolio Analytics</strong>
              <span>Conversion funnels and activity dashboards</span>
            </div>
          </li>
        </ul>

        <p className={styles.brandFooter}>
          © {new Date().getFullYear()} P7VC. Secure · Compliant · GDPR-ready.
        </p>
      </aside>

      {/* ── Login panel ── */}
      <main className={styles.panel}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardLogoMark}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L4 6.5v11L12 22l8-4.5v-11L12 2z"
                  stroke="#fff"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 2v10M4 6.5l8 5.5 8-5.5"
                  stroke="#fff"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className={styles.cardTitle}>Welcome to P7VC CRM</h2>
            <p className={styles.cardSubtitle}>
              Sign in with your <strong>@opsera.io</strong> Google account to continue
            </p>
          </div>

          <div className={styles.divider}>
            <span>Authorised access only</span>
          </div>

          <a
            href="/api/auth/login?connection=google-oauth2"
            className={styles.googleBtn}
          >
            <svg
              className={styles.googleIcon}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.62 4.62 0 0 1-2 3.03v2.52h3.24c1.9-1.74 3-4.31 3-7.34z"
                fill="#4285F4"
              />
              <path
                d="M10 20c2.7 0 4.97-.9 6.63-2.43l-3.24-2.52c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H1.07v2.6A9.99 9.99 0 0 0 10 20z"
                fill="#34A853"
              />
              <path
                d="M4.41 11.89A6.01 6.01 0 0 1 4.1 10c0-.66.11-1.3.31-1.89V5.51H1.07A9.99 9.99 0 0 0 0 10c0 1.61.38 3.13 1.07 4.49l3.34-2.6z"
                fill="#FBBC04"
              />
              <path
                d="M10 3.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87C14.97.99 12.7 0 10 0A9.99 9.99 0 0 0 1.07 5.51l3.34 2.6C5.2 5.72 7.4 3.96 10 3.96z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </a>

          <div className={styles.trust}>
            <p>
              By signing in you agree to our{' '}
              <a href="#">Terms of Service</a> and{' '}
              <a href="#">Privacy Policy</a>.{' '}
              Access is restricted to <strong>@opsera.io</strong> accounts.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
