// ── Feed registry ─────────────────────────────────────────────────────

export type FeedType = 'google-sheets' | 'csv' | 'json' | 'api';

export interface FeedOption {
  id:           string;
  label:        string;
  type:         FeedType;
  url:          string;
  csvExportUrl: string;
}

export const PRESET_FEEDS: FeedOption[] = [
  {
    id:           'gsheet-apr-1844900552',
    label:        'APR Vehicle Feed',
    type:         'google-sheets',
    url:          'https://docs.google.com/spreadsheets/d/1krXFKvgnN3YBh3d7aY-ZCdbR3Ql63Qomzs3MJYB5v6s/edit?gid=1844900552#gid=1844900552',
    csvExportUrl: 'https://docs.google.com/spreadsheets/d/1krXFKvgnN3YBh3d7aY-ZCdbR3Ql63Qomzs3MJYB5v6s/export?format=csv&gid=1844900552',
  },
];
