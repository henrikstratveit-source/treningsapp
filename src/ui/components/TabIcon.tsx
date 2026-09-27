// Enkle strek-ikoner for fanelinja (vises bare i utseendet «Ny»).
const paths: Record<string, string> = {
  hjem: 'M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5.5h4V20',
  historikk: 'M12 7v5l3 2M3.5 12a8.5 8.5 0 1 0 2.5-6M3 4v4h4',
  vekt: 'M5 20h14a1 1 0 0 0 1-1.1l-1.4-10A1 1 0 0 0 17.6 8H6.4a1 1 0 0 0-1 .9L4 18.9A1 1 0 0 0 5 20ZM9 8a3 3 0 0 1 6 0M12 12.5l1.5-2',
  statistikk: 'M4 20V10M10 20V4M16 20v-8M22 20H2',
  innstillinger:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7 7 0 0 1-1.7 1l-.3 2h-4l-.3-2a7 7 0 0 1-1.7-1l-1.9.7-2-3.4 1.6-1.2a7 7 0 0 1 0-3L3 9.3l2-3.4 1.9.7a7 7 0 0 1 1.7-1l.3-2h4l.3 2a7 7 0 0 1 1.7 1l1.9-.7 2 3.4-1.6 1.2a7 7 0 0 1 0 3Z',
}

export function TabIcon({ name }: { name: string }) {
  return (
    <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}
