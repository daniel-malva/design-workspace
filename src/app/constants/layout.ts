// Shared layout constants for the Design Workspace
// All values in pixels

export const PANEL_OFFSET      = 4   // gap between panel edge and viewport/container border
export const PANEL_GAP         = 8   // uniform gap between adjacent floating panels
export const PANEL_INNER_GAP   = 12  // gap between a panel's edge and inline floating elements (breadcrumb/buttons)
export const LEFT_RAIL_WIDTH   = 64  // width of the left icon rail
export const LEFT_PANE_WIDTH   = 260 // width of the left slide-in pane
export const RIGHT_PANEL_WIDTH = 268 // width of the right properties panel
export const TIMELINE_HEIGHT          = 52  // px — collapsed controls bar
export const TIMELINE_HEIGHT_EXPANDED = 180 // px — expanded with tracks

// ─── Derived positions (relative to the canvas container, which starts AFTER the LeftRail) ───

// Breadcrumb left — LeftPane VISIBLE
export const BREADCRUMB_LEFT_PANE_OPEN =
  PANEL_OFFSET + LEFT_PANE_WIDTH + PANEL_INNER_GAP   // 4 + 260 + 12 = 276px

// Breadcrumb left — LeftPane HIDDEN
export const BREADCRUMB_LEFT_PANE_CLOSED =
  PANEL_INNER_GAP                                    // 12px

// Action buttons right
export const ACTION_BUTTONS_RIGHT =
  RIGHT_PANEL_WIDTH + PANEL_OFFSET + PANEL_INNER_GAP // 268 + 4 + 12 = 284px

// Timeline / ZoomToolbar left — LeftPane VISIBLE
export const FLOATING_LEFT_PANE_OPEN =
  PANEL_OFFSET + LEFT_PANE_WIDTH + PANEL_GAP         // 4 + 260 + 8 = 272px

// Timeline / ZoomToolbar left — LeftPane HIDDEN
export const FLOATING_LEFT_PANE_CLOSED =
  PANEL_OFFSET + PANEL_GAP                           // 4 + 8 = 12px

// Timeline / ZoomToolbar right (always flush to left edge of RightPanel - gap)
export const FLOATING_RIGHT =
  RIGHT_PANEL_WIDTH + PANEL_OFFSET + PANEL_GAP       // 268 + 4 + 8 = 280px

// ZoomToolbar bottom — timeline visible: sits above the timeline + gap
export const ZOOM_TOOLBAR_BOTTOM_WITH_TIMELINE =
  PANEL_GAP + TIMELINE_HEIGHT + PANEL_GAP            // 8 + 52 + 8 = 68px

// ZoomToolbar bottom — no timeline
export const ZOOM_TOOLBAR_BOTTOM_NO_TIMELINE =
  PANEL_GAP                                          // 8px

export const PAGE_STRIP_HEIGHT = 80   // px — per-row variant thumbnails strip