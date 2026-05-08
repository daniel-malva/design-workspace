// ── Mock data for ActivityPanel ───────────────────────────────────────

export interface ActivityUser {
  name: string;
  initials: string;
  avatarColor: string;
}

export interface ActivityEvent {
  id: string;
  user: ActivityUser;
  action: string;
  category: string;
  categoryColor: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  user: ActivityUser;
  text: string;
  timestamp: string;
  resolved?: boolean;
}

export const AVATAR_COLORS = {
  lucas: '#7BB3E0',
  sofia: '#E8A598',
  ana:   '#6EC4A7',
  joao:  '#9B8EC4',
};

export const CATEGORY_COLORS = {
  Frame:     '#3B82F6',
  Style:     '#8B5CF6',
  Component: '#10B981',
  Layer:     '#6B7280',
  Text:      '#F59E0B',
  Image:     '#EC4899',
};

export const nowEvents: ActivityEvent[] = [
  { id: '1', user: { name: 'Lucas', initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, action: 'Frame resized · 1440×900',       category: 'Frame',     categoryColor: CATEGORY_COLORS.Frame,     timestamp: 'just'   },
  { id: '2', user: { name: 'Sofia', initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, action: 'Color changed · #378ADD',         category: 'Style',     categoryColor: CATEGORY_COLORS.Style,     timestamp: '1 min'  },
  { id: '3', user: { name: 'Ana',   initials: 'AN', avatarColor: AVATAR_COLORS.ana   }, action: 'Component added · Button...',     category: 'Component', categoryColor: CATEGORY_COLORS.Component, timestamp: '2 min'  },
];

export const earlierTodayEvents: ActivityEvent[] = [
  { id: '4', user: { name: 'João',  initials: 'JP', avatarColor: AVATAR_COLORS.joao  }, action: 'Layer renamed · "Hero sec...',   category: 'Layer',     categoryColor: CATEGORY_COLORS.Layer,     timestamp: '18 min' },
  { id: '5', user: { name: 'Lucas', initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, action: 'Frame created · Canvas 1',       category: 'Frame',     categoryColor: CATEGORY_COLORS.Frame,     timestamp: '32 min' },
  { id: '6', user: { name: 'Sofia', initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, action: 'Text edited · "Hero heading"',   category: 'Text',      categoryColor: CATEGORY_COLORS.Text,      timestamp: '45 min' },
];

export const yesterdayEvents: ActivityEvent[] = [
  { id: '7', user: { name: 'Ana',   initials: 'AN', avatarColor: AVATAR_COLORS.ana   }, action: 'Image replaced · hero-bg.png',   category: 'Image',     categoryColor: CATEGORY_COLORS.Image,     timestamp: 'yesterday' },
  { id: '8', user: { name: 'João',  initials: 'JP', avatarColor: AVATAR_COLORS.joao  }, action: 'Component updated · Nav Bar',    category: 'Component', categoryColor: CATEGORY_COLORS.Component, timestamp: 'yesterday' },
  { id: '9', user: { name: 'Lucas', initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, action: 'Style applied · Heading/H1',     category: 'Style',     categoryColor: CATEGORY_COLORS.Style,     timestamp: 'yesterday' },
];

export const lastWeekEvents: ActivityEvent[] = [
  { id: '10', user: { name: 'Sofia', initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, action: 'Frame duplicated · Mobile view', category: 'Frame',     categoryColor: CATEGORY_COLORS.Frame,     timestamp: 'Mon' },
  { id: '11', user: { name: 'Ana',   initials: 'AN', avatarColor: AVATAR_COLORS.ana   }, action: 'Layer grouped · Footer items',   category: 'Layer',     categoryColor: CATEGORY_COLORS.Layer,     timestamp: 'Tue' },
  { id: '12', user: { name: 'João',  initials: 'JP', avatarColor: AVATAR_COLORS.joao  }, action: 'Component detached · Card',      category: 'Component', categoryColor: CATEGORY_COLORS.Component, timestamp: 'Wed' },
];

export const monthAgoEvents: ActivityEvent[] = [
  { id: '13', user: { name: 'Lucas', initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, action: 'File created · Homepage v3',    category: 'Frame',     categoryColor: CATEGORY_COLORS.Frame,     timestamp: 'Mar 2' },
  { id: '14', user: { name: 'Sofia', initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, action: 'Palette added · Brand Colors',  category: 'Style',     categoryColor: CATEGORY_COLORS.Style,     timestamp: 'Mar 5' },
];

export const mockComments: Comment[] = [
  { id: 'c1', user: { name: 'Sofia',  initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, text: 'The hero section looks great! Can we try a slightly darker shade for the CTA button?', timestamp: '2 min',       resolved: false },
  { id: 'c2', user: { name: 'Lucas',  initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, text: 'Sure, I\'ll bump it to #3A2F8F. Also, the font size on mobile needs a review.',        timestamp: '5 min',       resolved: false },
  { id: 'c3', user: { name: 'Ana',    initials: 'AN', avatarColor: AVATAR_COLORS.ana   }, text: 'Agreed on mobile. The heading drops below the fold on 375px screens.',                  timestamp: '18 min',      resolved: true  },
  { id: 'c4', user: { name: 'João',   initials: 'JP', avatarColor: AVATAR_COLORS.joao  }, text: 'I\'ll create a breakpoint variant for it. Should be ready by EOD.',                    timestamp: '1 hr',        resolved: true  },
  { id: 'c5', user: { name: 'Sofia',  initials: 'SR', avatarColor: AVATAR_COLORS.sofia }, text: 'Perfect. Let\'s also revisit the nav spacing — it feels a bit tight at 1280px.',       timestamp: '3 hr',        resolved: false },
  { id: 'c6', user: { name: 'Lucas',  initials: 'LM', avatarColor: AVATAR_COLORS.lucas }, text: 'On it. I\'ll update the component and ping everyone once it\'s published.',            timestamp: 'yesterday',   resolved: false },
];
