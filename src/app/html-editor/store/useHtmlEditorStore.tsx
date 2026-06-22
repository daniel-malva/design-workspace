import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Domain types ─────────────────────────────────────────────────

export type HtmlRailItem =
  | 'code'
  | 'insert'
  | 'brandKit'
  | 'promptLibrary'
  | 'settings'
  | 'configure'
  | 'export';

export type HtmlEditorStatus =
  | 'idle'
  | 'loading'
  | 'generating'
  | 'saving'
  | 'error';

export type AgentMessageRole = 'user' | 'assistant';

export interface AgentMessage {
  id: string;
  role: AgentMessageRole;
  content: string;
  timestamp: string;
}

export interface HtmlEditorDocument {
  id: string;
  name: string;
  html: string;
  updatedAt?: string;
}

// ─── State shape ──────────────────────────────────────────────────

interface HtmlEditorState {
  document: HtmlEditorDocument;
  status: HtmlEditorStatus;
  activeRailItem: HtmlRailItem;
  zoomLevel: number;
  agentMessages: AgentMessage[];
  agentInput: string;
  previewRefreshKey: number;
  // actions
  setHtml: (html: string) => void;
  setStatus: (status: HtmlEditorStatus) => void;
  setActiveRailItem: (item: HtmlRailItem) => void;
  setZoomLevel: (zoom: number) => void;
  setAgentInput: (input: string) => void;
  sendAgentMessage: (content: string) => void;
  refreshPreview: () => void;
}

// ─── Default HTML template ────────────────────────────────────────

const INITIAL_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SUNOSI Ad Mock</title>
  <style>
    :root {
      --purple: #4a157a;
      --purple-dark: #3b0f63;
      --black: #111;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #eee;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    }
    .ad {
      width: 200px;
      height: 650px;
      border: 2px solid #111;
      border-radius: 2px;
      overflow: hidden;
      position: relative;
      background: #fff;
    }
    .logo-placeholder {
      border: 2px dashed var(--purple);
      margin: 16px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      color: var(--purple);
      font-weight: 600;
    }
    .header {
      text-align: center;
      font-size: 22px;
      font-weight: 800;
      padding: 12px 16px;
    }
    .cta {
      margin: 0 16px;
      background: #ccc;
      border-radius: 20px;
      text-align: center;
      padding: 10px;
      font-size: 13px;
      color: #555;
    }
    .legal {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px 16px;
      font-size: 9px;
    }
    .legal h4 { margin: 0 0 2px; font-size: 9px; letter-spacing: 0.05em; }
    .legal p { margin: 0 0 8px; color: #555; }
  </style>
</head>
<body>
  <div class="ad">
    <div class="logo-placeholder">Logo Primary</div>
    <div class="header">{header}</div>
    <div class="cta">{cta}</div>
    <div class="legal">
      <h4>INDICATION</h4>
      <p>{disclaimer_indication}</p>
      <h4>LIMITATIONS OF USE</h4>
      <p>{indication_limitations}</p>
    </div>
  </div>
</body>
</html>`;

// ─── Context ──────────────────────────────────────────────────────

const HtmlEditorContext = createContext<HtmlEditorState | null>(null);

export function HtmlEditorProvider({ children }: { children: React.ReactNode }) {
  const [document, setDocument] = useState<HtmlEditorDocument>({
    id: '1',
    name: 'index.html',
    html: INITIAL_HTML,
  });
  const [status, setStatus] = useState<HtmlEditorStatus>('idle');
  const [activeRailItem, setActiveRailItem] = useState<HtmlRailItem>('code');
  const [zoomLevel, setZoomLevel] = useState(300);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [agentInput, setAgentInput] = useState('');
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  const setHtml = useCallback((html: string) => {
    setDocument(prev => ({ ...prev, html, updatedAt: new Date().toISOString() }));
  }, []);

  const sendAgentMessage = useCallback((content: string) => {
    if (!content.trim()) return;
    const userMsg: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };
    setAgentMessages(prev => [...prev, userMsg]);
    setAgentInput('');
    setStatus('generating');

    // Stub: echo a placeholder agent response
    setTimeout(() => {
      const assistantMsg: AgentMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'I received your request. Connect a real agent service to generate HTML updates.',
        timestamp: new Date().toISOString(),
      };
      setAgentMessages(prev => [...prev, assistantMsg]);
      setStatus('idle');
    }, 800);
  }, []);

  return (
    <HtmlEditorContext.Provider
      value={{
        document,
        status,
        activeRailItem,
        zoomLevel,
        agentMessages,
        agentInput,
        previewRefreshKey,
        setHtml,
        setStatus,
        setActiveRailItem,
        setZoomLevel,
        setAgentInput,
        sendAgentMessage,
        refreshPreview: () => setPreviewRefreshKey(k => k + 1),
      }}
    >
      {children}
    </HtmlEditorContext.Provider>
  );
}

export function useHtmlEditor(): HtmlEditorState {
  const ctx = useContext(HtmlEditorContext);
  if (!ctx) throw new Error('useHtmlEditor must be used inside HtmlEditorProvider');
  return ctx;
}
