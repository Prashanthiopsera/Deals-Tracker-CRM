'use client';

import Link from 'next/link';
import { AppShell } from '../../components/AppShell';
import styles from './dashboard.module.css';

const STAT_CARDS = [
  { label: 'Total Companies', value: '—', sub: 'in pipeline', accent: '#6366f1' },
  { label: 'Active Deals', value: '—', sub: 'across all stages', accent: '#10b981' },
  { label: 'In Diligence', value: '—', sub: 'requiring action', accent: '#f59e0b' },
  { label: 'Closed This Month', value: '—', sub: 'portfolio additions', accent: '#3b82f6' },
];

const QUICK_LINKS = [
  {
    href: '/pipeline',
    label: 'Deal Pipeline',
    description: 'View and manage deal stages on the Kanban board',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
    color: '#6366f1',
  },
  {
    href: '/analytics/pipeline',
    label: 'Analytics',
    description: 'Conversion funnels, stage velocity, and portfolio metrics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 17l4-8 4 5 3-3 4 6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 21h18" strokeLinecap="round" />
      </svg>
    ),
    color: '#10b981',
  },
  {
    href: '/search',
    label: 'Universal Search',
    description: 'Search companies, contacts, and activities across the CRM',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>
    ),
    color: '#f59e0b',
  },
  {
    href: '/admin',
    label: 'Admin',
    description: 'Manage users, roles, permissions, and system settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M21 12h-2M5 12H3M12 3V1M12 23v-2" strokeLinecap="round" />
      </svg>
    ),
    color: '#3b82f6',
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Deal Flow Dashboard</h1>
            <p className={styles.subtitle}>
              Welcome back — here&apos;s your P7VC portfolio &amp; deal flow at a glance.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {STAT_CARDS.map((card) => (
            <div key={card.label} className={styles.statCard}>
              <div className={styles.statAccent} style={{ background: card.accent }} />
              <div className={styles.statValue}>{card.value}</div>
              <div className={styles.statLabel}>{card.label}</div>
              <div className={styles.statSub}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.quickGrid}>
          {QUICK_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className={styles.quickCard}>
              <div className={styles.quickIcon} style={{ color: item.color, background: `${item.color}18` }}>
                {item.icon}
              </div>
              <div>
                <div className={styles.quickLabel}>{item.label}</div>
                <div className={styles.quickDesc}>{item.description}</div>
              </div>
              <div className={styles.quickArrow}>
                <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
