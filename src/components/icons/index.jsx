// Icônes maison pour Klasso.
// Style volontairement géométrique et épuré (traits arrondis, formes simples)
// pour rester cohérent avec la marque de l'icône du logo. Aucune bibliothèque
// d'icônes externe n'est utilisée.

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconSchool(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" />
      <path d="M7 11.5V17c0 1.1 2.24 2 5 2s5-.9 5-2v-5.5" />
      <path d="M20 9.5V15" />
    </svg>
  );
}

export function IconLayers(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4 4 8.5 12 13l8-4.5L12 4Z" />
      <path d="M4 13.5 12 18l8-4.5" />
    </svg>
  );
}

export function IconChart(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="13" width="4" height="7" rx="1" />
      <rect x="10" y="9" width="4" height="11" rx="1" />
      <rect x="16" y="5" width="4" height="15" rx="1" />
    </svg>
  );
}

export function IconUsers(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c0-3.3 2.46-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.5 14.7c2.4.2 4 2.1 4 5.3" />
    </svg>
  );
}

export function IconClipboard(props) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <path d="M9 4.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.5" />
      <path d="M8.5 11h7M8.5 15h7M8.5 19h4" />
    </svg>
  );
}

export function IconCalendar(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <path d="M8 14h2M13 14h2M8 17h2" />
    </svg>
  );
}

export function IconMessage(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5.5h16v10.5H9.5L5 20v-4H4V5.5Z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </svg>
  );
}

export function IconWallet(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v2" />
      <rect x="3" y="8" width="18" height="11" rx="2.2" />
      <path d="M16 13.5h3" />
    </svg>
  );
}

export function IconShield(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 19 6v6c0 4.2-2.9 7.3-7 8.5-4.1-1.2-7-4.3-7-8.5V6l7-2.5Z" />
      <path d="M9 12.2l2 2 4-4.2" />
    </svg>
  );
}

export function IconArrowRight(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12h15" />
      <path d="M13.5 6.5 19 12l-5.5 5.5" />
    </svg>
  );
}

export function IconCheck(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
    </svg>
  );
}

export function IconMenu(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  );
}

export function IconClose(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5.5 5.5 18.5 18.5M18.5 5.5 5.5 18.5" />
    </svg>
  );
}

export function IconMapPin(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}

export function IconMail(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4.5 7 12 13l7.5-6" />
    </svg>
  );
}

export function IconPhone(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3.5h3L10.5 8 8 9.7c.9 2.2 2.6 3.9 4.8 4.8l1.7-2.5 4.5 1.5v3a2 2 0 0 1-2.2 2C10.2 18 6 13.8 5.5 7.2A2 2 0 0 1 6 3.5Z" />
    </svg>
  );
}

export function IconBell(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 10.5a6 6 0 0 1 12 0v3.3l1.5 2.7h-15l1.5-2.7v-3.3Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconSearch(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M19.5 19.5 15 15" />
    </svg>
  );
}

export function IconChevronDown(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5.5 8.5 12 15l6.5-6.5" />
    </svg>
  );
}

export function IconSettings(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="2.8" />
      <path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6M17.8 17.8l-1.6-1.6M7.8 7.8 6.2 6.2" />
    </svg>
  );
}

export function IconHome(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 9.5V20h12V9.5" />
    </svg>
  );
}

export function IconFile(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V8h4" />
    </svg>
  );
}

export function IconUserCircle(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="9.8" r="2.6" />
      <path d="M6.4 18.2c1-2.3 3-3.4 5.6-3.4s4.6 1.1 5.6 3.4" />
    </svg>
  );
}

export function IconMoreVertical(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="5.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconFilter(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5.5h16L14 13v6l-4 2v-8L4 5.5Z" />
    </svg>
  );
}

export function IconPlus(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4.5v15M4.5 12h15" />
    </svg>
  );
}

export function IconBuilding(props) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="3.5" width="10" height="17" rx="1" />
      <rect x="15" y="9" width="4.5" height="11.5" rx="1" />
      <path d="M8 7h1M11 7h1M8 10.5h1M11 10.5h1M8 14h1M11 14h1" />
    </svg>
  );
}
