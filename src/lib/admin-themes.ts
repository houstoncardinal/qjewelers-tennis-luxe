// ─── Sidebar type ─────────────────────────────────────────────────────────────

export type AdminThemeSidebar = {
  bg: string;
  borderRight: string;
  boxShadow: string;
  brandBg: string;
  brandBorder: string;
  brandBoxShadow: string;
  brandIconColor: string;
  brandTextColor: string;
  brandSubColor: string;
  statusDotColor: string;
  sectionLabelColor: string;
  navActiveBg: string;
  navActiveColor: string;
  navHoverBg: string;
  navInactiveColor: string;
  navIconActive: string;
  navIconInactive: string;
  activeBarBg: string;
  activeBarShadow: string;
  activeAccentDot: string;
  dividerColor: string;
  bottomLinkColor: string;
  bottomLinkHoverColor: string;
  bottomLinkHoverBg: string;
  logoutHoverColor: string;
  logoutHoverBg: string;
};

export type AdminTheme = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  previewGradient: string;
  accentColor: string;
  sidebar: AdminThemeSidebar;
  canvas: { bg: string };
  mobileBar: { bg: string; borderBottom: string };
};

// ─── CSS variable engine ──────────────────────────────────────────────────────

const D: Record<string, string> = {
  "at-canvas-bg":            "#f5f4f2",
  "at-card-bg":              "#ffffff",
  "at-card-border":          "1px solid rgba(0,0,0,0.07)",
  "at-card-shadow":          "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
  "at-card-divider":         "rgba(0,0,0,0.05)",
  "at-card-glow":            "linear-gradient(135deg,rgba(251,191,36,0.04),transparent 55%)",
  "at-field-bg":             "#ffffff",
  "at-field-border":         "rgba(0,0,0,0.12)",
  "at-field-focus":          "rgba(251,191,36,0.45)",
  "at-text-heading":         "#111827",
  "at-text-body":            "#374151",
  "at-text-muted":           "#9ca3af",
  "at-text-accent":          "#b45309",
  "at-kpi-bg":               "#ffffff",
  "at-kpi-border":           "1px solid rgba(251,191,36,0.22)",
  "at-kpi-top":              "#fbbf24",
  "at-kpi-shadow":           "0 2px 8px rgba(251,191,36,0.08), 0 4px 16px rgba(0,0,0,0.04)",
  "at-kpi-icon-bg":          "linear-gradient(135deg,rgba(251,191,36,0.20) 0%,rgba(251,191,36,0.08) 100%)",
  "at-kpi-icon":             "#f59e0b",
  "at-kpi-value":            "#111827",
  "at-kpi-label":            "rgba(180,83,9,0.70)",
  "at-chart-bar":            "linear-gradient(180deg,#fbbf24 0%,#f59e0b 100%)",
  "at-chart-empty":          "rgba(0,0,0,0.06)",
  "at-chart-peak-bg":        "rgba(251,191,36,0.08)",
  "at-chart-peak-text":      "#b45309",
  "at-chart-peak-border":    "rgba(251,191,36,0.18)",
  "at-chart-tip-bg":         "#111827",
  "at-chart-tip-text":       "#ffffff",
  "at-table-head":           "#9ca3af",
  "at-table-div":            "rgba(0,0,0,0.05)",
  "at-table-hover":          "rgba(0,0,0,0.025)",
  "at-avatar-bg":            "#f3f4f6",
  "at-avatar-border":        "rgba(0,0,0,0.07)",
  "at-avatar-text":          "#6b7280",
  "at-btn-bg":               "#ffffff",
  "at-btn-border":           "rgba(0,0,0,0.09)",
  "at-btn-text":             "#6b7280",
  "at-tile-bg":              "#ffffff",
  "at-tile-border":          "rgba(0,0,0,0.07)",
  "at-tile-left":            "#fbbf24",
  "at-tile-icon-bg":         "rgba(251,191,36,0.10)",
  "at-tile-icon":            "#f59e0b",
  "at-tile-text":            "#f59e0b",
  "at-wow-bg":               "#ffffff",
  "at-wow-border":           "rgba(0,0,0,0.07)",
  "at-alert-bg":             "#fffbeb",
  "at-alert-border":         "rgba(251,191,36,0.28)",
  "at-alert-text":           "#92400e",
  "at-alert-icon":           "#f59e0b",
  "at-live-bg":              "rgba(16,185,129,0.10)",
  "at-live-text":            "#059669",
  "at-live-border":          "rgba(16,185,129,0.20)",
  "at-matrix-low":           "rgba(59,130,246,0.12)",
  "at-matrix-mid":           "rgba(16,185,129,0.14)",
  "at-matrix-high":          "rgba(239,68,68,0.14)",
  "at-prism":                "linear-gradient(90deg,#d97706,#fbbf24,#fcd34d,#f59e0b,#d97706)",
  "at-pipe-pending-bg":      "#fffbeb",
  "at-pipe-pending-text":    "#92400e",
  "at-pipe-pending-border":  "rgba(245,158,11,0.30)",
  "at-pipe-process-bg":      "#eff6ff",
  "at-pipe-process-text":    "#1e40af",
  "at-pipe-process-border":  "rgba(59,130,246,0.30)",
  "at-pipe-shipped-bg":      "#f5f3ff",
  "at-pipe-shipped-text":    "#5b21b6",
  "at-pipe-shipped-border":  "rgba(139,92,246,0.30)",
  "at-pipe-delivered-bg":    "#f0fdf4",
  "at-pipe-delivered-text":  "#065f46",
  "at-pipe-delivered-border":"rgba(16,185,129,0.30)",
  "at-diamond-red":          "#ef4444",
  "at-diamond-green":        "#10b981",
  "at-diamond-blue":         "#3b82f6",
  "at-diamond-accent":       "#fbbf24",
  "at-gradient-shimmer":     "linear-gradient(135deg,rgba(239,68,68,0.06),rgba(16,185,129,0.06),rgba(59,130,246,0.06))",
  "at-nav-active-indicator": "#fbbf24",
  "at-section-heading":      "#111827",
  "at-section-heading-sub":  "#6b7280",
  "at-sidebar-brand-text":   "#ffffff",
  "at-input-bg":             "#ffffff",
  "at-input-border":         "rgba(0,0,0,0.12)",
  "at-input-focus":          "rgba(251,191,36,0.45)",
  "at-badge-bg":             "rgba(0,0,0,0.05)",
  "at-badge-text":           "#6b7280",
  "at-badge-border":         "rgba(0,0,0,0.08)",
  "at-tab-active":           "#111827",
  "at-tab-inactive":         "#9ca3af",
  "at-tab-border":           "#111827",
  "at-scrollbar-track":      "transparent",
  "at-scrollbar-thumb":      "rgba(0,0,0,0.15)",
  "at-skeleton-base":        "rgba(0,0,0,0.06)",
  "at-skeleton-shine":       "rgba(0,0,0,0.12)",
};

const O: Record<string, Record<string, string>> = {

  "yellow-gold": {
    "at-canvas-bg":           "#fffdf2",
    "at-card-bg":             "#fffef8",
    "at-card-border":         "1px solid rgba(255,215,0,0.22)",
    "at-card-shadow":         "0 2px 12px rgba(255,215,0,0.14), 0 4px 20px rgba(0,0,0,0.04)",
    "at-card-divider":        "rgba(255,215,0,0.18)",
    "at-text-heading":        "#2a1a00",
    "at-text-body":           "#4a3200",
    "at-text-muted":          "rgba(120,90,0,0.60)",
    "at-text-accent":         "#8a6000",
    "at-kpi-bg":              "linear-gradient(160deg,#fffef8 0%,#fffce0 100%)",
    "at-kpi-border":          "1px solid rgba(255,215,0,0.32)",
    "at-kpi-top":             "#FFD700",
    "at-kpi-shadow":          "0 0 0 1px rgba(255,215,0,0.18),0 4px 28px rgba(255,215,0,0.18)",
    "at-kpi-icon-bg":         "linear-gradient(135deg,rgba(255,215,0,0.32) 0%,rgba(255,180,0,0.14) 100%)",
    "at-kpi-icon":            "#b38000",
    "at-kpi-value":           "#2a1a00",
    "at-kpi-label":           "rgba(100,70,0,0.70)",
    "at-chart-bar":           "linear-gradient(180deg,#FFD700 0%,#cc8800 100%)",
    "at-chart-empty":         "rgba(255,215,0,0.16)",
    "at-chart-peak-bg":       "rgba(255,215,0,0.16)",
    "at-chart-peak-text":     "#7a5000",
    "at-chart-peak-border":   "rgba(255,215,0,0.40)",
    "at-chart-tip-bg":        "#1a1000",
    "at-chart-tip-text":      "#FFD700",
    "at-table-head":          "rgba(100,70,0,0.55)",
    "at-table-div":           "rgba(255,215,0,0.18)",
    "at-table-hover":         "rgba(255,215,0,0.07)",
    "at-avatar-bg":           "rgba(255,215,0,0.16)",
    "at-avatar-border":       "rgba(255,215,0,0.32)",
    "at-avatar-text":         "#8a6000",
    "at-btn-bg":              "#fffef8",
    "at-btn-border":          "rgba(255,215,0,0.32)",
    "at-btn-text":            "#7a5800",
    "at-tile-bg":             "#fffef8",
    "at-tile-border":         "rgba(255,215,0,0.22)",
    "at-tile-left":           "#FFD700",
    "at-tile-icon-bg":        "rgba(255,215,0,0.18)",
    "at-tile-icon":           "#b38000",
    "at-tile-text":           "#8a6000",
    "at-wow-bg":              "#fffef8",
    "at-wow-border":          "rgba(255,215,0,0.22)",
    "at-alert-bg":            "linear-gradient(135deg,#fffce0 0%,#fffef8 100%)",
    "at-alert-border":        "rgba(255,215,0,0.42)",
    "at-alert-text":          "#5a3a00",
    "at-alert-icon":          "#b38000",
    "at-live-bg":             "rgba(255,215,0,0.14)",
    "at-live-text":           "#8a6000",
    "at-live-border":         "rgba(255,215,0,0.34)",
    "at-pipe-pending-bg":     "rgba(255,215,0,0.16)",
    "at-pipe-pending-text":   "#7a5000",
    "at-pipe-pending-border": "rgba(255,215,0,0.34)",
    "at-pipe-process-bg":     "rgba(200,150,0,0.12)",
    "at-pipe-process-text":   "#6a4000",
    "at-pipe-process-border": "rgba(200,140,0,0.28)",
    "at-pipe-shipped-bg":     "rgba(255,200,0,0.10)",
    "at-pipe-shipped-text":   "#5a3800",
    "at-pipe-shipped-border": "rgba(255,200,0,0.26)",
    "at-pipe-delivered-bg":   "rgba(255,215,0,0.18)",
    "at-pipe-delivered-text": "#4a3000",
    "at-pipe-delivered-border":"rgba(255,215,0,0.36)",
  },

  "white-gold": {
    "at-canvas-bg":           "#f4f5f8",
    "at-card-bg":             "#ffffff",
    "at-card-border":         "1px solid rgba(212,205,180,0.22)",
    "at-card-shadow":         "0 2px 10px rgba(212,205,180,0.14), 0 4px 20px rgba(0,0,0,0.04)",
    "at-card-divider":        "rgba(212,205,180,0.15)",
    "at-text-heading":        "#1a1c24",
    "at-text-body":           "#2e3240",
    "at-text-muted":          "rgba(100,105,130,0.65)",
    "at-text-accent":         "#6b6545",
    "at-kpi-bg":              "linear-gradient(160deg,#ffffff 0%,#f8f7f4 100%)",
    "at-kpi-border":          "1px solid rgba(212,205,180,0.28)",
    "at-kpi-top":             "#c8bea0",
    "at-kpi-shadow":          "0 0 0 1px rgba(212,205,180,0.16),0 4px 20px rgba(212,205,180,0.14)",
    "at-kpi-icon-bg":         "linear-gradient(135deg,rgba(212,205,180,0.22) 0%,rgba(200,190,160,0.10) 100%)",
    "at-kpi-icon":            "#a09070",
    "at-kpi-value":           "#1a1c24",
    "at-kpi-label":           "rgba(80,75,55,0.65)",
    "at-chart-bar":           "linear-gradient(180deg,#d4cdb4 0%,#a09070 100%)",
    "at-chart-empty":         "rgba(212,205,180,0.14)",
    "at-chart-peak-bg":       "rgba(212,205,180,0.14)",
    "at-chart-peak-text":     "#6b6545",
    "at-chart-peak-border":   "rgba(212,205,180,0.32)",
    "at-chart-tip-bg":        "#0e1018",
    "at-chart-tip-text":      "#d4cdb4",
    "at-table-head":          "rgba(100,105,130,0.55)",
    "at-table-div":           "rgba(212,205,180,0.16)",
    "at-table-hover":         "rgba(212,205,180,0.07)",
    "at-avatar-bg":           "rgba(212,205,180,0.16)",
    "at-avatar-border":       "rgba(212,205,180,0.28)",
    "at-avatar-text":         "#8a8060",
    "at-btn-bg":              "#ffffff",
    "at-btn-border":          "rgba(212,205,180,0.28)",
    "at-btn-text":            "#6b6545",
    "at-tile-bg":             "#ffffff",
    "at-tile-border":         "rgba(212,205,180,0.22)",
    "at-tile-left":           "#c8bea0",
    "at-tile-icon-bg":        "rgba(212,205,180,0.16)",
    "at-tile-icon":           "#a09070",
    "at-tile-text":           "#8a8060",
    "at-wow-bg":              "#ffffff",
    "at-wow-border":          "rgba(212,205,180,0.22)",
    "at-alert-bg":            "rgba(212,205,180,0.12)",
    "at-alert-border":        "rgba(212,205,180,0.30)",
    "at-alert-text":          "#5a5538",
    "at-alert-icon":          "#a09070",
    "at-live-bg":             "rgba(148,210,189,0.12)",
    "at-live-text":           "#306050",
    "at-live-border":         "rgba(148,210,189,0.26)",
  },

  "holographic": {
    "at-canvas-bg":           "#f8f4ff",
    "at-card-bg":             "rgba(255,255,255,0.85)",
    "at-card-border":         "1px solid rgba(0,255,231,0.18)",
    "at-card-shadow":         "0 2px 16px rgba(0,255,231,0.10), 0 4px 20px rgba(180,0,255,0.06)",
    "at-card-divider":        "rgba(0,255,231,0.12)",
    "at-text-heading":        "#1a0540",
    "at-text-body":           "#2d1060",
    "at-text-muted":          "rgba(100,60,180,0.60)",
    "at-text-accent":         "#0080aa",
    "at-kpi-bg":              "rgba(255,255,255,0.90)",
    "at-kpi-border":          "1px solid rgba(0,255,231,0.25)",
    "at-kpi-top":             "#00ffe7",
    "at-kpi-shadow":          "0 0 0 1px rgba(0,255,231,0.14),0 4px 28px rgba(0,255,231,0.16)",
    "at-kpi-icon-bg":         "linear-gradient(135deg,rgba(0,255,231,0.20) 0%,rgba(255,0,204,0.12) 100%)",
    "at-kpi-icon":            "#00bca8",
    "at-kpi-value":           "#1a0540",
    "at-kpi-label":           "rgba(0,180,155,0.75)",
    "at-chart-bar":           "linear-gradient(180deg,#00ffe7 0%,#ff00cc 100%)",
    "at-chart-empty":         "rgba(0,255,231,0.12)",
    "at-chart-peak-bg":       "rgba(0,255,231,0.12)",
    "at-chart-peak-text":     "#008070",
    "at-chart-peak-border":   "rgba(0,255,231,0.28)",
    "at-chart-tip-bg":        "#0d0221",
    "at-chart-tip-text":      "#00ffe7",
    "at-table-head":          "rgba(100,60,180,0.55)",
    "at-table-div":           "rgba(0,255,231,0.12)",
    "at-table-hover":         "rgba(0,255,231,0.06)",
    "at-avatar-bg":           "rgba(0,255,231,0.12)",
    "at-avatar-border":       "rgba(0,255,231,0.24)",
    "at-avatar-text":         "#008070",
    "at-btn-bg":              "rgba(255,255,255,0.85)",
    "at-btn-border":          "rgba(0,255,231,0.24)",
    "at-btn-text":            "#008070",
    "at-tile-bg":             "rgba(255,255,255,0.85)",
    "at-tile-border":         "rgba(0,255,231,0.18)",
    "at-tile-left":           "#00ffe7",
    "at-tile-icon-bg":        "rgba(0,255,231,0.14)",
    "at-tile-icon":           "#00bca8",
    "at-tile-text":           "#008070",
    "at-wow-bg":              "rgba(255,255,255,0.85)",
    "at-wow-border":          "rgba(0,255,231,0.18)",
    "at-alert-bg":            "rgba(0,255,231,0.10)",
    "at-alert-border":        "rgba(0,255,231,0.28)",
    "at-alert-text":          "#005548",
    "at-alert-icon":          "#00bca8",
    "at-live-bg":             "rgba(0,255,170,0.12)",
    "at-live-text":           "#006655",
    "at-live-border":         "rgba(0,255,170,0.24)",
    "at-pipe-pending-bg":     "rgba(0,255,231,0.12)",
    "at-pipe-pending-text":   "#005548",
    "at-pipe-pending-border": "rgba(0,255,231,0.28)",
    "at-pipe-process-bg":     "rgba(0,100,255,0.10)",
    "at-pipe-process-text":   "#003090",
    "at-pipe-process-border": "rgba(0,100,255,0.22)",
    "at-pipe-shipped-bg":     "rgba(255,0,204,0.10)",
    "at-pipe-shipped-text":   "#880060",
    "at-pipe-shipped-border": "rgba(255,0,204,0.22)",
    "at-pipe-delivered-bg":   "rgba(0,255,170,0.12)",
    "at-pipe-delivered-text": "#006655",
    "at-pipe-delivered-border":"rgba(0,255,170,0.26)",
  },

  "cyber-punk": {
    "at-canvas-bg":           "#fdf5ff",
    "at-card-bg":             "#ffffff",
    "at-card-border":         "1px solid rgba(255,0,204,0.18)",
    "at-card-shadow":         "0 2px 14px rgba(255,0,204,0.10), 0 4px 20px rgba(0,0,0,0.04)",
    "at-card-divider":        "rgba(255,0,204,0.12)",
    "at-text-heading":        "#0a0018",
    "at-text-body":           "#180030",
    "at-text-muted":          "rgba(120,0,100,0.55)",
    "at-text-accent":         "#cc0080",
    "at-kpi-bg":              "#ffffff",
    "at-kpi-border":          "1px solid rgba(255,0,204,0.24)",
    "at-kpi-top":             "#ff2dce",
    "at-kpi-shadow":          "0 0 0 1px rgba(255,0,204,0.16),0 4px 28px rgba(255,0,204,0.16)",
    "at-kpi-icon-bg":         "linear-gradient(135deg,rgba(255,0,204,0.20) 0%,rgba(0,255,255,0.08) 100%)",
    "at-kpi-icon":            "#cc0090",
    "at-kpi-value":           "#0a0018",
    "at-kpi-label":           "rgba(180,0,120,0.70)",
    "at-chart-bar":           "linear-gradient(180deg,#ff2dce 0%,#00ffff 100%)",
    "at-chart-empty":         "rgba(255,0,204,0.10)",
    "at-chart-peak-bg":       "rgba(255,0,204,0.10)",
    "at-chart-peak-text":     "#990060",
    "at-chart-peak-border":   "rgba(255,0,204,0.26)",
    "at-chart-tip-bg":        "#020010",
    "at-chart-tip-text":      "#ff2dce",
    "at-table-head":          "rgba(120,0,100,0.52)",
    "at-table-div":           "rgba(255,0,204,0.10)",
    "at-table-hover":         "rgba(255,0,204,0.05)",
    "at-avatar-bg":           "rgba(255,0,204,0.10)",
    "at-avatar-border":       "rgba(255,0,204,0.22)",
    "at-avatar-text":         "#990060",
    "at-btn-bg":              "#ffffff",
    "at-btn-border":          "rgba(255,0,204,0.22)",
    "at-btn-text":            "#990060",
    "at-tile-bg":             "#ffffff",
    "at-tile-border":         "rgba(255,0,204,0.18)",
    "at-tile-left":           "#ff2dce",
    "at-tile-icon-bg":        "rgba(255,0,204,0.12)",
    "at-tile-icon":           "#cc0090",
    "at-tile-text":           "#990060",
    "at-wow-bg":              "#ffffff",
    "at-wow-border":          "rgba(255,0,204,0.18)",
    "at-alert-bg":            "rgba(255,0,204,0.08)",
    "at-alert-border":        "rgba(255,0,204,0.26)",
    "at-alert-text":          "#880050",
    "at-alert-icon":          "#cc0090",
    "at-live-bg":             "rgba(0,255,255,0.10)",
    "at-live-text":           "#005f6e",
    "at-live-border":         "rgba(0,255,255,0.22)",
  },

  "emerald": {
    "at-canvas-bg":           "#f0fdf7",
    "at-card-bg":             "#ffffff",
    "at-card-border":         "1px solid rgba(16,185,129,0.16)",
    "at-card-shadow":         "0 2px 12px rgba(16,185,129,0.10), 0 4px 20px rgba(0,0,0,0.03)",
    "at-card-divider":        "rgba(16,185,129,0.12)",
    "at-text-heading":        "#022c1e",
    "at-text-body":           "#064030",
    "at-text-muted":          "rgba(5,90,65,0.55)",
    "at-text-accent":         "#047a57",
    "at-kpi-bg":              "linear-gradient(160deg,#ffffff 0%,#f0fdf7 100%)",
    "at-kpi-border":          "1px solid rgba(16,185,129,0.22)",
    "at-kpi-top":             "#10b981",
    "at-kpi-shadow":          "0 0 0 1px rgba(16,185,129,0.14),0 4px 24px rgba(16,185,129,0.14)",
    "at-kpi-icon-bg":         "linear-gradient(135deg,rgba(16,185,129,0.24) 0%,rgba(5,150,100,0.10) 100%)",
    "at-kpi-icon":            "#059669",
    "at-kpi-value":           "#022c1e",
    "at-kpi-label":           "rgba(5,100,70,0.70)",
    "at-chart-bar":           "linear-gradient(180deg,#34d399 0%,#059669 100%)",
    "at-chart-empty":         "rgba(16,185,129,0.12)",
    "at-chart-peak-bg":       "rgba(16,185,129,0.12)",
    "at-chart-peak-text":     "#047a57",
    "at-chart-peak-border":   "rgba(16,185,129,0.28)",
    "at-chart-tip-bg":        "#011208",
    "at-chart-tip-text":      "#34d399",
    "at-table-head":          "rgba(5,90,65,0.52)",
    "at-table-div":           "rgba(16,185,129,0.10)",
    "at-table-hover":         "rgba(16,185,129,0.05)",
    "at-avatar-bg":           "rgba(16,185,129,0.12)",
    "at-avatar-border":       "rgba(16,185,129,0.22)",
    "at-avatar-text":         "#047a57",
    "at-btn-bg":              "#ffffff",
    "at-btn-border":          "rgba(16,185,129,0.22)",
    "at-btn-text":            "#047a57",
    "at-tile-bg":             "#ffffff",
    "at-tile-border":         "rgba(16,185,129,0.16)",
    "at-tile-left":           "#10b981",
    "at-tile-icon-bg":        "rgba(16,185,129,0.14)",
    "at-tile-icon":           "#059669",
    "at-tile-text":           "#047a57",
    "at-wow-bg":              "#ffffff",
    "at-wow-border":          "rgba(16,185,129,0.16)",
    "at-alert-bg":            "rgba(16,185,129,0.08)",
    "at-alert-border":        "rgba(16,185,129,0.24)",
    "at-alert-text":          "#034d33",
    "at-alert-icon":          "#10b981",
    "at-live-bg":             "rgba(16,185,129,0.12)",
    "at-live-text":           "#047a57",
    "at-live-border":         "rgba(16,185,129,0.24)",
    "at-pipe-pending-bg":     "rgba(110,231,183,0.14)",
    "at-pipe-pending-text":   "#065f46",
    "at-pipe-pending-border": "rgba(16,185,129,0.26)",
    "at-pipe-process-bg":     "rgba(16,185,129,0.12)",
    "at-pipe-process-text":   "#047a57",
    "at-pipe-process-border": "rgba(16,185,129,0.24)",
    "at-pipe-shipped-bg":     "rgba(5,150,100,0.10)",
    "at-pipe-shipped-text":   "#034d33",
    "at-pipe-shipped-border": "rgba(5,150,100,0.22)",
    "at-pipe-delivered-bg":   "rgba(16,185,129,0.16)",
    "at-pipe-delivered-text": "#022c1e",
    "at-pipe-delivered-border":"rgba(16,185,129,0.30)",
  },

  "diamond": {
    "at-canvas-bg":           "#f0f7ff",
    "at-card-bg":             "#ffffff",
    "at-card-border":         "1px solid rgba(147,197,253,0.20)",
    "at-card-shadow":         "0 2px 14px rgba(147,197,253,0.14), 0 4px 20px rgba(0,0,0,0.03)",
    "at-card-divider":        "rgba(147,197,253,0.14)",
    "at-text-heading":        "#020818",
    "at-text-body":           "#041028",
    "at-text-muted":          "rgba(30,60,130,0.55)",
    "at-text-accent":         "#1a4fa0",
    "at-kpi-bg":              "linear-gradient(160deg,#ffffff 0%,#f0f7ff 100%)",
    "at-kpi-border":          "1px solid rgba(147,197,253,0.26)",
    "at-kpi-top":             "#93c5fd",
    "at-kpi-shadow":          "0 0 0 1px rgba(147,197,253,0.18),0 4px 28px rgba(147,197,253,0.18)",
    "at-kpi-icon-bg":         "linear-gradient(135deg,rgba(147,197,253,0.24) 0%,rgba(96,165,250,0.10) 100%)",
    "at-kpi-icon":            "#2563eb",
    "at-kpi-value":           "#020818",
    "at-kpi-label":           "rgba(30,60,160,0.68)",
    "at-chart-bar":           "linear-gradient(180deg,#bfdbfe 0%,#3b82f6 100%)",
    "at-chart-empty":         "rgba(147,197,253,0.14)",
    "at-chart-peak-bg":       "rgba(147,197,253,0.14)",
    "at-chart-peak-text":     "#1a4fa0",
    "at-chart-peak-border":   "rgba(147,197,253,0.30)",
    "at-chart-tip-bg":        "#04061a",
    "at-chart-tip-text":      "#93c5fd",
    "at-table-head":          "rgba(30,60,130,0.50)",
    "at-table-div":           "rgba(147,197,253,0.14)",
    "at-table-hover":         "rgba(147,197,253,0.07)",
    "at-avatar-bg":           "rgba(147,197,253,0.14)",
    "at-avatar-border":       "rgba(147,197,253,0.26)",
    "at-avatar-text":         "#1a4fa0",
    "at-btn-bg":              "#ffffff",
    "at-btn-border":          "rgba(147,197,253,0.26)",
    "at-btn-text":            "#1a4fa0",
    "at-tile-bg":             "#ffffff",
    "at-tile-border":         "rgba(147,197,253,0.20)",
    "at-tile-left":           "#93c5fd",
    "at-tile-icon-bg":        "rgba(147,197,253,0.16)",
    "at-tile-icon":           "#2563eb",
    "at-tile-text":           "#1a4fa0",
    "at-wow-bg":              "#ffffff",
    "at-wow-border":          "rgba(147,197,253,0.20)",
    "at-alert-bg":            "rgba(147,197,253,0.10)",
    "at-alert-border":        "rgba(147,197,253,0.26)",
    "at-alert-text":          "#1a3a80",
    "at-alert-icon":          "#2563eb",
    "at-live-bg":             "rgba(96,165,250,0.12)",
    "at-live-text":           "#1a4fa0",
    "at-live-border":         "rgba(96,165,250,0.24)",
  },

  "leopard": {
    "at-canvas-bg":           "#fffbf0",
    "at-card-bg":             "#fffef8",
    "at-card-border":         "1px solid rgba(245,158,11,0.20)",
    "at-card-shadow":         "0 2px 14px rgba(245,158,11,0.12), 0 4px 20px rgba(0,0,0,0.04)",
    "at-card-divider":        "rgba(245,158,11,0.14)",
    "at-text-heading":        "#1a0a00",
    "at-text-body":           "#3a1800",
    "at-text-muted":          "rgba(130,75,0,0.58)",
    "at-text-accent":         "#a85000",
    "at-kpi-bg":              "linear-gradient(160deg,#fffef8 0%,#fff8e0 100%)",
    "at-kpi-border":          "1px solid rgba(245,158,11,0.28)",
    "at-kpi-top":             "#f59e0b",
    "at-kpi-shadow":          "0 0 0 1px rgba(245,158,11,0.16),0 4px 26px rgba(245,158,11,0.16)",
    "at-kpi-icon-bg":         "linear-gradient(135deg,rgba(245,158,11,0.26) 0%,rgba(217,119,6,0.10) 100%)",
    "at-kpi-icon":            "#d97706",
    "at-kpi-value":           "#1a0a00",
    "at-kpi-label":           "rgba(140,70,0,0.68)",
    "at-chart-bar":           "linear-gradient(180deg,#fcd34d 0%,#d97706 100%)",
    "at-chart-empty":         "rgba(245,158,11,0.14)",
    "at-chart-peak-bg":       "rgba(245,158,11,0.14)",
    "at-chart-peak-text":     "#a85000",
    "at-chart-peak-border":   "rgba(245,158,11,0.32)",
    "at-chart-tip-bg":        "#180900",
    "at-chart-tip-text":      "#fcd34d",
    "at-table-head":          "rgba(130,75,0,0.52)",
    "at-table-div":           "rgba(245,158,11,0.14)",
    "at-table-hover":         "rgba(245,158,11,0.06)",
    "at-avatar-bg":           "rgba(245,158,11,0.14)",
    "at-avatar-border":       "rgba(245,158,11,0.28)",
    "at-avatar-text":         "#a85000",
    "at-btn-bg":              "#fffef8",
    "at-btn-border":          "rgba(245,158,11,0.28)",
    "at-btn-text":            "#8a5000",
    "at-tile-bg":             "#fffef8",
    "at-tile-border":         "rgba(245,158,11,0.20)",
    "at-tile-left":           "#f59e0b",
    "at-tile-icon-bg":        "rgba(245,158,11,0.16)",
    "at-tile-icon":           "#d97706",
    "at-tile-text":           "#a85000",
    "at-wow-bg":              "#fffef8",
    "at-wow-border":          "rgba(245,158,11,0.20)",
    "at-alert-bg":            "rgba(245,158,11,0.10)",
    "at-alert-border":        "rgba(245,158,11,0.30)",
    "at-alert-text":          "#7a3800",
    "at-alert-icon":          "#d97706",
    "at-live-bg":             "rgba(245,158,11,0.12)",
    "at-live-text":           "#a85000",
    "at-live-border":         "rgba(245,158,11,0.26)",
  },

  "zebra": {
    "at-canvas-bg":           "#f4f4f4",
    "at-card-bg":             "#ffffff",
    "at-card-border":         "1px solid rgba(0,0,0,0.14)",
    "at-card-shadow":         "0 2px 10px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.05)",
    "at-card-divider":        "rgba(0,0,0,0.10)",
    "at-text-heading":        "#000000",
    "at-text-body":           "#111111",
    "at-text-muted":          "#555555",
    "at-text-accent":         "#000000",
    "at-kpi-bg":              "#ffffff",
    "at-kpi-border":          "1px solid rgba(0,0,0,0.18)",
    "at-kpi-top":             "#111111",
    "at-kpi-shadow":          "0 0 0 1px rgba(0,0,0,0.10),0 4px 20px rgba(0,0,0,0.10)",
    "at-kpi-icon-bg":         "linear-gradient(135deg,rgba(0,0,0,0.08) 0%,rgba(0,0,0,0.03) 100%)",
    "at-kpi-icon":            "#111111",
    "at-kpi-value":           "#000000",
    "at-kpi-label":           "rgba(0,0,0,0.55)",
    "at-chart-bar":           "linear-gradient(180deg,#222222 0%,#000000 100%)",
    "at-chart-empty":         "rgba(0,0,0,0.08)",
    "at-chart-peak-bg":       "rgba(0,0,0,0.06)",
    "at-chart-peak-text":     "#111111",
    "at-chart-peak-border":   "rgba(0,0,0,0.18)",
    "at-chart-tip-bg":        "#000000",
    "at-chart-tip-text":      "#ffffff",
    "at-table-head":          "rgba(0,0,0,0.50)",
    "at-table-div":           "rgba(0,0,0,0.08)",
    "at-table-hover":         "rgba(0,0,0,0.04)",
    "at-avatar-bg":           "#f0f0f0",
    "at-avatar-border":       "rgba(0,0,0,0.14)",
    "at-avatar-text":         "#333333",
    "at-btn-bg":              "#ffffff",
    "at-btn-border":          "rgba(0,0,0,0.18)",
    "at-btn-text":            "#333333",
    "at-tile-bg":             "#ffffff",
    "at-tile-border":         "rgba(0,0,0,0.14)",
    "at-tile-left":           "#111111",
    "at-tile-icon-bg":        "rgba(0,0,0,0.06)",
    "at-tile-icon":           "#111111",
    "at-tile-text":           "#333333",
    "at-wow-bg":              "#ffffff",
    "at-wow-border":          "rgba(0,0,0,0.14)",
    "at-alert-bg":            "rgba(0,0,0,0.04)",
    "at-alert-border":        "rgba(0,0,0,0.18)",
    "at-alert-text":          "#111111",
    "at-alert-icon":          "#333333",
    "at-live-bg":             "rgba(0,0,0,0.06)",
    "at-live-text":           "#111111",
    "at-live-border":         "rgba(0,0,0,0.18)",
    "at-pipe-pending-bg":     "rgba(0,0,0,0.06)",
    "at-pipe-pending-text":   "#111111",
    "at-pipe-pending-border": "rgba(0,0,0,0.18)",
    "at-pipe-process-bg":     "rgba(0,0,0,0.08)",
    "at-pipe-process-text":   "#000000",
    "at-pipe-process-border": "rgba(0,0,0,0.20)",
    "at-pipe-shipped-bg":     "rgba(0,0,0,0.10)",
    "at-pipe-shipped-text":   "#000000",
    "at-pipe-shipped-border": "rgba(0,0,0,0.22)",
    "at-pipe-delivered-bg":   "#f0f0f0",
    "at-pipe-delivered-text": "#000000",
    "at-pipe-delivered-border":"rgba(0,0,0,0.24)",
  },

  "steel": {
    "at-canvas-bg":           "#eef1f5",
    "at-card-bg":             "#f8f9fb",
    "at-card-border":         "1px solid rgba(148,163,184,0.22)",
    "at-card-shadow":         "0 2px 10px rgba(100,116,139,0.10), 0 4px 20px rgba(0,0,0,0.04)",
    "at-card-divider":        "rgba(148,163,184,0.16)",
    "at-text-heading":        "#0f1620",
    "at-text-body":           "#1e2840",
    "at-text-muted":          "rgba(60,80,110,0.58)",
    "at-text-accent":         "#4a6080",
    "at-kpi-bg":              "linear-gradient(160deg,#f8f9fb 0%,#eef1f5 100%)",
    "at-kpi-border":          "1px solid rgba(148,163,184,0.28)",
    "at-kpi-top":             "#94a3b8",
    "at-kpi-shadow":          "0 0 0 1px rgba(148,163,184,0.16),0 4px 22px rgba(100,116,139,0.12)",
    "at-kpi-icon-bg":         "linear-gradient(135deg,rgba(148,163,184,0.22) 0%,rgba(100,116,139,0.08) 100%)",
    "at-kpi-icon":            "#64748b",
    "at-kpi-value":           "#0f1620",
    "at-kpi-label":           "rgba(60,80,110,0.65)",
    "at-chart-bar":           "linear-gradient(180deg,#cbd5e1 0%,#64748b 100%)",
    "at-chart-empty":         "rgba(148,163,184,0.16)",
    "at-chart-peak-bg":       "rgba(148,163,184,0.14)",
    "at-chart-peak-text":     "#4a6080",
    "at-chart-peak-border":   "rgba(148,163,184,0.30)",
    "at-chart-tip-bg":        "#141820",
    "at-chart-tip-text":      "#cbd5e1",
    "at-table-head":          "rgba(60,80,110,0.52)",
    "at-table-div":           "rgba(148,163,184,0.16)",
    "at-table-hover":         "rgba(148,163,184,0.07)",
    "at-avatar-bg":           "rgba(148,163,184,0.16)",
    "at-avatar-border":       "rgba(148,163,184,0.28)",
    "at-avatar-text":         "#4a6080",
    "at-btn-bg":              "#f8f9fb",
    "at-btn-border":          "rgba(148,163,184,0.28)",
    "at-btn-text":            "#4a6080",
    "at-tile-bg":             "#f8f9fb",
    "at-tile-border":         "rgba(148,163,184,0.22)",
    "at-tile-left":           "#94a3b8",
    "at-tile-icon-bg":        "rgba(148,163,184,0.16)",
    "at-tile-icon":           "#64748b",
    "at-tile-text":           "#4a6080",
    "at-wow-bg":              "#f8f9fb",
    "at-wow-border":          "rgba(148,163,184,0.22)",
    "at-alert-bg":            "rgba(148,163,184,0.10)",
    "at-alert-border":        "rgba(148,163,184,0.28)",
    "at-alert-text":          "#2e4060",
    "at-alert-icon":          "#64748b",
    "at-live-bg":             "rgba(100,116,139,0.12)",
    "at-live-text":           "#3a5070",
    "at-live-border":         "rgba(100,116,139,0.24)",
  },

  "ivory": {
    "at-canvas-bg":           "#fdf8f0",
    "at-card-bg":             "#fffef9",
    "at-card-border":         "1px solid rgba(232,213,176,0.28)",
    "at-card-shadow":         "0 2px 12px rgba(200,168,120,0.12), 0 4px 20px rgba(0,0,0,0.04)",
    "at-card-divider":        "rgba(232,213,176,0.20)",
    "at-text-heading":        "#1e1408",
    "at-text-body":           "#342210",
    "at-text-muted":          "rgba(120,90,50,0.58)",
    "at-text-accent":         "#8a6030",
    "at-kpi-bg":              "linear-gradient(160deg,#fffef9 0%,#fdf4e4 100%)",
    "at-kpi-border":          "1px solid rgba(232,213,176,0.36)",
    "at-kpi-top":             "#e8d5b0",
    "at-kpi-shadow":          "0 0 0 1px rgba(232,213,176,0.22),0 4px 24px rgba(200,168,120,0.16)",
    "at-kpi-icon-bg":         "linear-gradient(135deg,rgba(232,213,176,0.32) 0%,rgba(200,168,120,0.14) 100%)",
    "at-kpi-icon":            "#c8a870",
    "at-kpi-value":           "#1e1408",
    "at-kpi-label":           "rgba(120,90,50,0.68)",
    "at-chart-bar":           "linear-gradient(180deg,#f5ead0 0%,#c8a060 100%)",
    "at-chart-empty":         "rgba(232,213,176,0.20)",
    "at-chart-peak-bg":       "rgba(232,213,176,0.20)",
    "at-chart-peak-text":     "#8a6030",
    "at-chart-peak-border":   "rgba(232,213,176,0.40)",
    "at-chart-tip-bg":        "#1a1008",
    "at-chart-tip-text":      "#f5ead0",
    "at-table-head":          "rgba(120,90,50,0.52)",
    "at-table-div":           "rgba(232,213,176,0.20)",
    "at-table-hover":         "rgba(232,213,176,0.09)",
    "at-avatar-bg":           "rgba(232,213,176,0.20)",
    "at-avatar-border":       "rgba(232,213,176,0.36)",
    "at-avatar-text":         "#8a6030",
    "at-btn-bg":              "#fffef9",
    "at-btn-border":          "rgba(232,213,176,0.36)",
    "at-btn-text":            "#8a6030",
    "at-tile-bg":             "#fffef9",
    "at-tile-border":         "rgba(232,213,176,0.28)",
    "at-tile-left":           "#e8d5b0",
    "at-tile-icon-bg":        "rgba(232,213,176,0.22)",
    "at-tile-icon":           "#c8a870",
    "at-tile-text":           "#8a6030",
    "at-wow-bg":              "#fffef9",
    "at-wow-border":          "rgba(232,213,176,0.28)",
    "at-alert-bg":            "rgba(232,213,176,0.14)",
    "at-alert-border":        "rgba(232,213,176,0.38)",
    "at-alert-text":          "#6a4820",
    "at-alert-icon":          "#c8a870",
    "at-live-bg":             "rgba(200,168,120,0.14)",
    "at-live-text":           "#8a6030",
    "at-live-border":         "rgba(200,168,120,0.28)",
  },

  "rose-gold": {
    "at-canvas-bg":           "#fff0f5",
    "at-card-bg":             "#fff8fb",
    "at-card-border":         "1px solid rgba(249,168,212,0.22)",
    "at-card-shadow":         "0 2px 14px rgba(244,114,182,0.10), 0 4px 20px rgba(0,0,0,0.04)",
    "at-card-divider":        "rgba(249,168,212,0.16)",
    "at-text-heading":        "#1a050e",
    "at-text-body":           "#320a1a",
    "at-text-muted":          "rgba(150,30,80,0.52)",
    "at-text-accent":         "#b0226e",
    "at-kpi-bg":              "linear-gradient(160deg,#fff8fb 0%,#ffeef6 100%)",
    "at-kpi-border":          "1px solid rgba(249,168,212,0.30)",
    "at-kpi-top":             "#f9a8d4",
    "at-kpi-shadow":          "0 0 0 1px rgba(249,168,212,0.18),0 4px 26px rgba(244,114,182,0.16)",
    "at-kpi-icon-bg":         "linear-gradient(135deg,rgba(249,168,212,0.28) 0%,rgba(244,114,182,0.10) 100%)",
    "at-kpi-icon":            "#ec4899",
    "at-kpi-value":           "#1a050e",
    "at-kpi-label":           "rgba(160,40,100,0.68)",
    "at-chart-bar":           "linear-gradient(180deg,#fbcfe8 0%,#ec4899 100%)",
    "at-chart-empty":         "rgba(249,168,212,0.14)",
    "at-chart-peak-bg":       "rgba(249,168,212,0.14)",
    "at-chart-peak-text":     "#b0226e",
    "at-chart-peak-border":   "rgba(249,168,212,0.34)",
    "at-chart-tip-bg":        "#120808",
    "at-chart-tip-text":      "#fbcfe8",
    "at-table-head":          "rgba(150,30,80,0.50)",
    "at-table-div":           "rgba(249,168,212,0.14)",
    "at-table-hover":         "rgba(249,168,212,0.06)",
    "at-avatar-bg":           "rgba(249,168,212,0.14)",
    "at-avatar-border":       "rgba(249,168,212,0.28)",
    "at-avatar-text":         "#b0226e",
    "at-btn-bg":              "#fff8fb",
    "at-btn-border":          "rgba(249,168,212,0.28)",
    "at-btn-text":            "#a0206a",
    "at-tile-bg":             "#fff8fb",
    "at-tile-border":         "rgba(249,168,212,0.22)",
    "at-tile-left":           "#f9a8d4",
    "at-tile-icon-bg":        "rgba(249,168,212,0.16)",
    "at-tile-icon":           "#ec4899",
    "at-tile-text":           "#b0226e",
    "at-wow-bg":              "#fff8fb",
    "at-wow-border":          "rgba(249,168,212,0.22)",
    "at-alert-bg":            "rgba(249,168,212,0.10)",
    "at-alert-border":        "rgba(249,168,212,0.28)",
    "at-alert-text":          "#880042",
    "at-alert-icon":          "#ec4899",
    "at-live-bg":             "rgba(244,114,182,0.12)",
    "at-live-text":           "#a0206a",
    "at-live-border":         "rgba(244,114,182,0.24)",
  },
};

// Per-theme keyframe animations + CSS overrides
const K: Record<string, string> = {

  "yellow-gold": `
@keyframes at-gold-sweep {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.admin-shell.at-yellow-gold .admin-kpi-card {
  position: relative; overflow: hidden;
}
.admin-shell.at-yellow-gold .admin-kpi-card::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.14) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: at-gold-sweep 4s ease-in-out infinite;
}`,

  "white-gold": `
@keyframes at-platinum-sweep {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.admin-shell.at-white-gold .admin-kpi-card {
  position: relative; overflow: hidden;
}
.admin-shell.at-white-gold .admin-kpi-card::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent 0%, rgba(212,205,180,0.18) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: at-platinum-sweep 5s ease-in-out infinite;
}`,

  "holographic": `
@keyframes at-holo-bg {
  0%   { background-position: 0%   50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0%   50%; }
}
.admin-shell.at-holographic {
  background: linear-gradient(270deg, #f8f0ff, #f0f8ff, #f0fff8, #fff8f0, #fff0f8, #f8f0ff) !important;
  background-size: 600% 600% !important;
  animation: at-holo-bg 14s ease infinite !important;
}
@keyframes at-holo-card {
  0%, 100% { border-color: rgba(0,255,231,0.22); }
  33%       { border-color: rgba(255,0,204,0.22); }
  66%       { border-color: rgba(100,180,255,0.22); }
}
.admin-shell.at-holographic .admin-kpi-card {
  animation: at-holo-card 4s ease-in-out infinite;
}
@keyframes at-holo-bar {
  0%   { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}
.admin-shell.at-holographic .admin-chart-bar-filled {
  animation: at-holo-bar 6s linear infinite;
}`,

  "cyber-punk": `
.admin-shell.at-cyber-punk {
  background-image: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(255,0,204,0.022) 2px, rgba(255,0,204,0.022) 4px
  );
}
@keyframes at-cyber-neon {
  0%, 100% { box-shadow: 0 0 0 1px rgba(255,0,204,0.22), 0 4px 22px rgba(255,0,204,0.12); }
  50%       { box-shadow: 0 0 0 1px rgba(255,0,204,0.40), 0 4px 30px rgba(255,0,204,0.24); }
}
.admin-shell.at-cyber-punk .admin-kpi-card {
  animation: at-cyber-neon 2.5s ease-in-out infinite;
}
@keyframes at-cyber-scan {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}
.admin-shell.at-cyber-punk::before {
  content: ''; position: fixed; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255,0,204,0.35), rgba(0,255,255,0.35), transparent);
  animation: at-cyber-scan 8s linear infinite;
  pointer-events: none; z-index: 9999;
}`,

  "emerald": `
@keyframes at-emerald-pulse {
  0%, 100% { box-shadow: 0 2px 12px rgba(16,185,129,0.12), 0 4px 20px rgba(0,0,0,0.03); }
  50%       { box-shadow: 0 2px 20px rgba(16,185,129,0.22), 0 4px 24px rgba(0,0,0,0.04); }
}
.admin-shell.at-emerald .admin-kpi-card {
  animation: at-emerald-pulse 3.5s ease-in-out infinite;
}`,

  "diamond": `
@keyframes at-ice-sparkle {
  0%, 100% {
    box-shadow: 0 2px 14px rgba(147,197,253,0.14), 0 4px 20px rgba(0,0,0,0.03);
  }
  50% {
    box-shadow: 0 0 0 1px rgba(147,197,253,0.28), 0 4px 30px rgba(147,197,253,0.24), 0 1px 0 rgba(255,255,255,0.9) inset;
  }
}
.admin-shell.at-diamond .admin-kpi-card {
  animation: at-ice-sparkle 4s ease-in-out infinite;
}
@keyframes at-ice-bg {
  0%, 100% { background-position: 0% 0%; }
  50%       { background-position: 100% 100%; }
}
.admin-shell.at-diamond {
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f2ff 50%, #f0f7ff 100%) !important;
  background-size: 200% 200% !important;
  animation: at-ice-bg 10s ease-in-out infinite !important;
}`,

  "leopard": `
.admin-shell.at-leopard {
  background-image:
    radial-gradient(ellipse 6px 4px at 20px 30px, rgba(245,158,11,0.10) 70%, transparent 70%),
    radial-gradient(ellipse 5px 3px at 48px 12px, rgba(245,158,11,0.08) 70%, transparent 70%),
    radial-gradient(ellipse 4px 5px at 70px 45px, rgba(245,158,11,0.09) 70%, transparent 70%),
    radial-gradient(ellipse 7px 4px at 10px 60px, rgba(245,158,11,0.07) 70%, transparent 70%);
  background-size: 80px 70px;
}
@keyframes at-leopard-glow {
  0%, 100% { box-shadow: 0 2px 14px rgba(245,158,11,0.12), 0 4px 20px rgba(0,0,0,0.04); }
  50%       { box-shadow: 0 2px 20px rgba(245,158,11,0.22), 0 4px 24px rgba(0,0,0,0.05); }
}
.admin-shell.at-leopard .admin-kpi-card {
  animation: at-leopard-glow 3s ease-in-out infinite;
}`,

  "zebra": `
.admin-shell.at-zebra .admin-kpi-card {
  border-left: 3px solid #111111 !important;
}
.admin-shell.at-zebra .admin-chart-bar-filled {
  background: repeating-linear-gradient(45deg,#111 0px,#111 4px,#333 4px,#333 8px) !important;
}`,

  "steel": `
.admin-shell.at-steel {
  background-image: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 60px,
    rgba(148,163,184,0.04) 60px,
    rgba(148,163,184,0.04) 61px
  );
}
@keyframes at-steel-sheen {
  0%   { background-position: -300% center; }
  100% { background-position:  300% center; }
}
.admin-shell.at-steel .admin-kpi-card {
  position: relative; overflow: hidden;
}
.admin-shell.at-steel .admin-kpi-card::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: at-steel-sheen 6s ease-in-out infinite;
}`,

  "ivory": `
@keyframes at-ivory-glow {
  0%, 100% { box-shadow: 0 2px 12px rgba(200,168,120,0.12), 0 4px 20px rgba(0,0,0,0.04); }
  50%       { box-shadow: 0 2px 22px rgba(200,168,120,0.22), 0 4px 24px rgba(0,0,0,0.04); }
}
.admin-shell.at-ivory .admin-kpi-card {
  animation: at-ivory-glow 4s ease-in-out infinite;
}`,

  "rose-gold": `
@keyframes at-rose-pulse {
  0%, 100% { box-shadow: 0 2px 14px rgba(244,114,182,0.12), 0 4px 20px rgba(0,0,0,0.04); }
  50%       { box-shadow: 0 2px 24px rgba(244,114,182,0.24), 0 4px 24px rgba(0,0,0,0.04); }
}
.admin-shell.at-rose-gold .admin-kpi-card {
  animation: at-rose-pulse 3.5s ease-in-out infinite;
}
@keyframes at-rose-sweep {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.admin-shell.at-rose-gold .admin-kpi-card {
  position: relative; overflow: hidden;
}
.admin-shell.at-rose-gold .admin-kpi-card::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent 0%, rgba(249,168,212,0.18) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: at-rose-sweep 5s ease-in-out infinite;
}`,
};

// Shared sidebar + base animations (injected with every theme)
const BASE_CSS = `
@keyframes at-status-pulse {
  0%,100%{ transform:scale(1);   opacity:1;   }
  50%    { transform:scale(0.72);opacity:0.45; }
}
.admin-status-dot { animation: at-status-pulse 2.8s cubic-bezier(0.4,0,0.6,1) infinite; }

@keyframes at-bar-glow {
  0%,100%{ opacity:1;    }
  50%    { opacity:0.52; }
}
.admin-active-bar { animation: at-bar-glow 2.2s ease-in-out infinite; }

.admin-shell .admin-table tbody tr {
  border-bottom: 1px solid var(--at-table-div, rgba(0,0,0,0.05));
  cursor: pointer;
  transition: background 0.15s;
}
.admin-shell .admin-table tbody tr:hover {
  background: var(--at-table-hover, rgba(0,0,0,0.025)) !important;
}
.admin-shell .admin-table thead tr {
  border-bottom: 1px solid var(--at-table-div, rgba(0,0,0,0.05));
}

.admin-shell .admin-surface {
  background: var(--at-card-bg) !important;
  border: var(--at-card-border) !important;
  box-shadow: var(--at-card-shadow) !important;
  color: var(--at-text-body);
  position: relative;
}
.admin-shell .admin-surface::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: var(--at-card-glow);
  opacity: 0.45;
  mix-blend-mode: multiply;
}
.admin-shell .admin-surface > * {
  position: relative;
}
.admin-shell .admin-heading { color: var(--at-text-heading) !important; }
.admin-shell .admin-muted { color: var(--at-text-muted) !important; }
.admin-shell .admin-accent { color: var(--at-text-accent) !important; }
.admin-shell input,
.admin-shell textarea,
.admin-shell select {
  background: var(--at-field-bg) !important;
  border-color: var(--at-field-border) !important;
  color: var(--at-text-body) !important;
}
.admin-shell input:focus,
.admin-shell textarea:focus,
.admin-shell select:focus {
  border-color: var(--at-field-focus) !important;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--at-field-focus), transparent 70%) !important;
}
.admin-shell .admin-prism-line {
  background: var(--at-prism);
  background-size: 240% 100%;
  animation: at-prism-flow 8s ease-in-out infinite;
}
@keyframes at-prism-flow {
  0%,100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Diamond refraction accent line at top of admin shell */
.admin-shell::after {
  content: '';
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg,
    var(--at-diamond-red, #ef4444),
    var(--at-diamond-accent, #fbbf24),
    var(--at-diamond-green, #10b981),
    var(--at-diamond-blue, #3b82f6),
    var(--at-diamond-red, #ef4444));
  background-size: 200% 100%;
  animation: at-prism-flow 6s ease-in-out infinite;
  z-index: 9998;
  pointer-events: none;
}

/* Diamond refraction shimmer gradient on surfaces */
.admin-shell .admin-surface {
  border-image: linear-gradient(135deg,
    var(--at-card-border-color, rgba(0,0,0,0.07)),
    var(--at-diamond-accent, rgba(251,191,36,0.3)),
    var(--at-card-border-color, rgba(0,0,0,0.07))) 1;
}

/* Smooth scrollbar theming */
.admin-shell *::-webkit-scrollbar { width: 6px; height: 6px; }
.admin-shell *::-webkit-scrollbar-track { background: var(--at-scrollbar-track, transparent); }
.admin-shell *::-webkit-scrollbar-thumb {
  background: var(--at-scrollbar-thumb, rgba(0,0,0,0.15));
  border-radius: 99px;
}

/* Skeleton loading animation */
.admin-shell .animate-pulse {
  --tw-animate-pulse-duration: 2s;
}
`;

export function themeCSS(theme: AdminTheme): string {
  const vars = { ...D, ...(O[theme.id] ?? {}) };
  const varBlock = Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`).join("\n");
  return `${BASE_CSS}\n.admin-shell {\n${varBlock}\n}\n${K[theme.id] ?? ""}`;
}

// ─── Theme definitions ────────────────────────────────────────────────────────

export const THEMES: AdminTheme[] = [
  {
    id: "dark-noir",
    name: "Dark Noir",
    emoji: "⬛",
    description: "Classic obsidian luxury with 18k gold accents.",
    previewGradient: "linear-gradient(160deg,#0e0d0c 0%,#111110 100%)",
    accentColor: "#fbbf24",
    canvas: { bg: "#f5f4f2" },
    mobileBar: { bg: "#0c0c0c", borderBottom: "1px solid rgba(251,191,36,0.06)" },
    sidebar: {
      bg: "linear-gradient(180deg,#0e0d0c 0%,#111110 60%,#0c0c0b 100%)",
      borderRight: "1px solid rgba(255,215,0,0.08)",
      boxShadow: "4px 0 32px rgba(0,0,0,0.35)",
      brandBg: "linear-gradient(135deg,rgba(251,191,36,0.22) 0%,rgba(251,191,36,0.08) 100%)",
      brandBorder: "rgba(251,191,36,0.30)",
      brandBoxShadow: "0 2px 8px rgba(251,191,36,0.12)",
      brandIconColor: "#fbbf24",
      brandTextColor: "rgba(255,255,255,0.90)",
      brandSubColor: "rgba(251,191,36,0.60)",
      statusDotColor: "#34d399",
      sectionLabelColor: "rgba(251,191,36,0.55)",
      navActiveBg: "linear-gradient(90deg,rgba(251,191,36,0.14) 0%,rgba(251,191,36,0.04) 100%)",
      navActiveColor: "rgba(255,255,255,0.95)",
      navHoverBg: "rgba(255,255,255,0.06)",
      navInactiveColor: "rgba(255,255,255,0.55)",
      navIconActive: "#fbbf24",
      navIconInactive: "rgba(255,255,255,0.38)",
      activeBarBg: "linear-gradient(180deg,#fcd34d 0%,#f59e0b 100%)",
      activeBarShadow: "0 0 10px rgba(251,191,36,0.70)",
      activeAccentDot: "#fbbf24",
      dividerColor: "rgba(255,255,255,0.07)",
      bottomLinkColor: "rgba(255,255,255,0.45)",
      bottomLinkHoverColor: "rgba(255,255,255,0.80)",
      bottomLinkHoverBg: "rgba(255,255,255,0.05)",
      logoutHoverColor: "rgba(248,113,113,0.85)",
      logoutHoverBg: "rgba(239,68,68,0.08)",
    },
  },
  {
    id: "yellow-gold",
    name: "Yellow Gold",
    emoji: "🟡",
    description: "24k molten luxury — burnished gold on deep warm obsidian.",
    previewGradient: "linear-gradient(160deg,#100c00 0%,#1a1000 100%)",
    accentColor: "#FFD700",
    canvas: { bg: "#fffdf2" },
    mobileBar: { bg: "#100c00", borderBottom: "1px solid rgba(255,215,0,0.12)" },
    sidebar: {
      bg: "linear-gradient(180deg,#100c00 0%,#160e00 55%,#0a0800 100%)",
      borderRight: "1px solid rgba(255,215,0,0.20)",
      boxShadow: "4px 0 32px rgba(0,0,0,0.55),0 0 0 1px rgba(255,215,0,0.06) inset",
      brandBg: "linear-gradient(135deg,rgba(255,215,0,0.28) 0%,rgba(255,180,0,0.10) 100%)",
      brandBorder: "rgba(255,215,0,0.48)",
      brandBoxShadow: "0 0 18px rgba(255,215,0,0.22),0 2px 8px rgba(0,0,0,0.4)",
      brandIconColor: "#FFD700",
      brandTextColor: "#FFD700",
      brandSubColor: "rgba(255,215,0,0.55)",
      statusDotColor: "#FFD700",
      sectionLabelColor: "rgba(255,215,0,0.50)",
      navActiveBg: "linear-gradient(90deg,rgba(255,215,0,0.18) 0%,rgba(255,180,0,0.05) 100%)",
      navActiveColor: "#FFD700",
      navHoverBg: "rgba(255,215,0,0.08)",
      navInactiveColor: "rgba(255,215,0,0.40)",
      navIconActive: "#FFD700",
      navIconInactive: "rgba(255,215,0,0.28)",
      activeBarBg: "linear-gradient(180deg,#FFE84D 0%,#FFB800 100%)",
      activeBarShadow: "0 0 14px rgba(255,215,0,0.85)",
      activeAccentDot: "#FFD700",
      dividerColor: "rgba(255,215,0,0.12)",
      bottomLinkColor: "rgba(255,215,0,0.38)",
      bottomLinkHoverColor: "#FFD700",
      bottomLinkHoverBg: "rgba(255,215,0,0.08)",
      logoutHoverColor: "rgba(248,113,113,0.85)",
      logoutHoverBg: "rgba(239,68,68,0.08)",
    },
  },
  {
    id: "white-gold",
    name: "White Gold",
    emoji: "🤍",
    description: "Platinum precision — cool silver shimmer on deep midnight.",
    previewGradient: "linear-gradient(160deg,#09090f 0%,#0e111a 100%)",
    accentColor: "#d4cdb4",
    canvas: { bg: "#f4f5f8" },
    mobileBar: { bg: "#09090f", borderBottom: "1px solid rgba(200,190,160,0.10)" },
    sidebar: {
      bg: "linear-gradient(180deg,#09090f 0%,#0d0f18 55%,#07080d 100%)",
      borderRight: "1px solid rgba(212,205,180,0.14)",
      boxShadow: "4px 0 32px rgba(0,0,0,0.55)",
      brandBg: "linear-gradient(135deg,rgba(212,205,180,0.22) 0%,rgba(200,190,160,0.08) 100%)",
      brandBorder: "rgba(212,205,180,0.38)",
      brandBoxShadow: "0 0 16px rgba(212,205,180,0.14),0 2px 8px rgba(0,0,0,0.4)",
      brandIconColor: "#d4cdb4",
      brandTextColor: "#e8e3d0",
      brandSubColor: "rgba(212,205,180,0.55)",
      statusDotColor: "#94d2bd",
      sectionLabelColor: "rgba(212,205,180,0.50)",
      navActiveBg: "linear-gradient(90deg,rgba(212,205,180,0.16) 0%,rgba(200,190,160,0.04) 100%)",
      navActiveColor: "#e8e3d0",
      navHoverBg: "rgba(212,205,180,0.07)",
      navInactiveColor: "rgba(212,205,180,0.42)",
      navIconActive: "#d4cdb4",
      navIconInactive: "rgba(212,205,180,0.28)",
      activeBarBg: "linear-gradient(180deg,#f0ece0 0%,#c8bea0 100%)",
      activeBarShadow: "0 0 10px rgba(212,205,180,0.60)",
      activeAccentDot: "#d4cdb4",
      dividerColor: "rgba(212,205,180,0.09)",
      bottomLinkColor: "rgba(212,205,180,0.40)",
      bottomLinkHoverColor: "#d4cdb4",
      bottomLinkHoverBg: "rgba(212,205,180,0.07)",
      logoutHoverColor: "rgba(248,113,113,0.80)",
      logoutHoverBg: "rgba(239,68,68,0.08)",
    },
  },
  {
    id: "holographic",
    name: "Holographic",
    emoji: "🌈",
    description: "Iridescent chromatic shift — prismatic light on infinite depth.",
    previewGradient: "linear-gradient(160deg,#0d0221 0%,#1a0533 40%,#070e22 100%)",
    accentColor: "#00ffe7",
    canvas: { bg: "#f8f4ff" },
    mobileBar: { bg: "#0d0221", borderBottom: "1px solid rgba(0,255,231,0.10)" },
    sidebar: {
      bg: "linear-gradient(160deg,#0d0221 0%,#110333 40%,#061224 70%,#02080d 100%)",
      borderRight: "1px solid rgba(0,255,231,0.18)",
      boxShadow: "4px 0 40px rgba(0,0,0,0.65),0 0 1px rgba(0,255,231,0.15) inset",
      brandBg: "linear-gradient(135deg,rgba(0,255,231,0.18) 0%,rgba(255,0,204,0.10) 100%)",
      brandBorder: "rgba(0,255,231,0.32)",
      brandBoxShadow: "0 0 20px rgba(0,255,231,0.18),0 0 8px rgba(255,0,204,0.10)",
      brandIconColor: "#00ffe7",
      brandTextColor: "#e0f7ff",
      brandSubColor: "rgba(0,255,231,0.55)",
      statusDotColor: "#00ff88",
      sectionLabelColor: "rgba(0,255,231,0.48)",
      navActiveBg: "linear-gradient(90deg,rgba(0,255,231,0.14) 0%,rgba(255,0,204,0.05) 100%)",
      navActiveColor: "#00ffe7",
      navHoverBg: "rgba(0,255,231,0.07)",
      navInactiveColor: "rgba(150,220,255,0.45)",
      navIconActive: "#00ffe7",
      navIconInactive: "rgba(150,200,255,0.32)",
      activeBarBg: "linear-gradient(180deg,#00ffe7 0%,#ff00cc 100%)",
      activeBarShadow: "0 0 14px rgba(0,255,231,0.75)",
      activeAccentDot: "#00ffe7",
      dividerColor: "rgba(0,255,231,0.09)",
      bottomLinkColor: "rgba(150,220,255,0.40)",
      bottomLinkHoverColor: "#00ffe7",
      bottomLinkHoverBg: "rgba(0,255,231,0.07)",
      logoutHoverColor: "rgba(255,80,130,0.85)",
      logoutHoverBg: "rgba(255,0,100,0.08)",
    },
  },
  {
    id: "cyber-punk",
    name: "Cyber Punk",
    emoji: "⚡",
    description: "Neon magenta on void black — scanlines, glow, the grid is alive.",
    previewGradient: "linear-gradient(160deg,#020010 0%,#06001e 100%)",
    accentColor: "#ff2dce",
    canvas: { bg: "#fdf5ff" },
    mobileBar: { bg: "#020010", borderBottom: "1px solid rgba(255,0,204,0.12)" },
    sidebar: {
      bg: "linear-gradient(180deg,#020010 0%,#05001c 55%,#010009 100%)",
      borderRight: "1px solid rgba(255,0,204,0.20)",
      boxShadow: "4px 0 32px rgba(0,0,0,0.75),0 0 1px rgba(255,0,204,0.12) inset",
      brandBg: "linear-gradient(135deg,rgba(255,0,204,0.22) 0%,rgba(0,255,255,0.08) 100%)",
      brandBorder: "rgba(255,0,204,0.42)",
      brandBoxShadow: "0 0 22px rgba(255,0,204,0.25),0 0 8px rgba(0,255,255,0.10)",
      brandIconColor: "#ff2dce",
      brandTextColor: "#ff80ea",
      brandSubColor: "rgba(255,0,204,0.60)",
      statusDotColor: "#00ffff",
      sectionLabelColor: "rgba(255,0,204,0.52)",
      navActiveBg: "linear-gradient(90deg,rgba(255,0,204,0.16) 0%,rgba(0,255,255,0.04) 100%)",
      navActiveColor: "#ff2dce",
      navHoverBg: "rgba(255,0,204,0.08)",
      navInactiveColor: "rgba(255,120,220,0.42)",
      navIconActive: "#ff2dce",
      navIconInactive: "rgba(255,0,204,0.28)",
      activeBarBg: "linear-gradient(180deg,#ff2dce 0%,#00ffff 100%)",
      activeBarShadow: "0 0 16px rgba(255,0,204,0.85)",
      activeAccentDot: "#ff2dce",
      dividerColor: "rgba(255,0,204,0.10)",
      bottomLinkColor: "rgba(255,120,220,0.40)",
      bottomLinkHoverColor: "#ff2dce",
      bottomLinkHoverBg: "rgba(255,0,204,0.08)",
      logoutHoverColor: "rgba(255,100,100,0.85)",
      logoutHoverBg: "rgba(239,68,68,0.08)",
    },
  },
  {
    id: "emerald",
    name: "Emerald",
    emoji: "💚",
    description: "Deep forest gem — emerald fire pulsing on obsidian jade.",
    previewGradient: "linear-gradient(160deg,#011208 0%,#031a0c 100%)",
    accentColor: "#10b981",
    canvas: { bg: "#f0fdf7" },
    mobileBar: { bg: "#011208", borderBottom: "1px solid rgba(16,185,129,0.10)" },
    sidebar: {
      bg: "linear-gradient(180deg,#011208 0%,#031a0c 55%,#010d06 100%)",
      borderRight: "1px solid rgba(16,185,129,0.16)",
      boxShadow: "4px 0 32px rgba(0,0,0,0.55)",
      brandBg: "linear-gradient(135deg,rgba(16,185,129,0.24) 0%,rgba(5,150,100,0.08) 100%)",
      brandBorder: "rgba(16,185,129,0.38)",
      brandBoxShadow: "0 0 18px rgba(16,185,129,0.20),0 2px 8px rgba(0,0,0,0.4)",
      brandIconColor: "#10b981",
      brandTextColor: "#d1fae5",
      brandSubColor: "rgba(16,185,129,0.60)",
      statusDotColor: "#34d399",
      sectionLabelColor: "rgba(16,185,129,0.52)",
      navActiveBg: "linear-gradient(90deg,rgba(16,185,129,0.16) 0%,rgba(5,150,100,0.04) 100%)",
      navActiveColor: "#6ee7b7",
      navHoverBg: "rgba(16,185,129,0.08)",
      navInactiveColor: "rgba(110,231,183,0.42)",
      navIconActive: "#10b981",
      navIconInactive: "rgba(16,185,129,0.28)",
      activeBarBg: "linear-gradient(180deg,#34d399 0%,#059669 100%)",
      activeBarShadow: "0 0 12px rgba(16,185,129,0.72)",
      activeAccentDot: "#10b981",
      dividerColor: "rgba(16,185,129,0.09)",
      bottomLinkColor: "rgba(110,231,183,0.40)",
      bottomLinkHoverColor: "#10b981",
      bottomLinkHoverBg: "rgba(16,185,129,0.07)",
      logoutHoverColor: "rgba(248,113,113,0.85)",
      logoutHoverBg: "rgba(239,68,68,0.08)",
    },
  },
  {
    id: "diamond",
    name: "Diamond",
    emoji: "💎",
    description: "Crystal clarity — brilliant ice facets on deep midnight blue.",
    previewGradient: "linear-gradient(160deg,#04061a 0%,#060820 100%)",
    accentColor: "#93c5fd",
    canvas: { bg: "#f0f7ff" },
    mobileBar: { bg: "#04061a", borderBottom: "1px solid rgba(147,197,253,0.10)" },
    sidebar: {
      bg: "linear-gradient(180deg,#04061a 0%,#060820 55%,#030510 100%)",
      borderRight: "1px solid rgba(147,197,253,0.16)",
      boxShadow: "4px 0 32px rgba(0,0,0,0.60)",
      brandBg: "linear-gradient(135deg,rgba(147,197,253,0.20) 0%,rgba(96,165,250,0.08) 100%)",
      brandBorder: "rgba(147,197,253,0.35)",
      brandBoxShadow: "0 0 18px rgba(147,197,253,0.16),0 2px 8px rgba(0,0,0,0.4)",
      brandIconColor: "#93c5fd",
      brandTextColor: "#dbeafe",
      brandSubColor: "rgba(147,197,253,0.58)",
      statusDotColor: "#60a5fa",
      sectionLabelColor: "rgba(147,197,253,0.50)",
      navActiveBg: "linear-gradient(90deg,rgba(147,197,253,0.16) 0%,rgba(96,165,250,0.04) 100%)",
      navActiveColor: "#bfdbfe",
      navHoverBg: "rgba(147,197,253,0.08)",
      navInactiveColor: "rgba(147,197,253,0.42)",
      navIconActive: "#93c5fd",
      navIconInactive: "rgba(147,197,253,0.28)",
      activeBarBg: "linear-gradient(180deg,#bfdbfe 0%,#3b82f6 100%)",
      activeBarShadow: "0 0 12px rgba(147,197,253,0.68)",
      activeAccentDot: "#93c5fd",
      dividerColor: "rgba(147,197,253,0.09)",
      bottomLinkColor: "rgba(147,197,253,0.40)",
      bottomLinkHoverColor: "#93c5fd",
      bottomLinkHoverBg: "rgba(147,197,253,0.07)",
      logoutHoverColor: "rgba(252,165,165,0.85)",
      logoutHoverBg: "rgba(239,68,68,0.08)",
    },
  },
  {
    id: "leopard",
    name: "Leopard",
    emoji: "🐆",
    description: "Wild savanna luxury — fierce amber spots on deep obsidian.",
    previewGradient: "linear-gradient(160deg,#180900 0%,#1f0f00 100%)",
    accentColor: "#f59e0b",
    canvas: { bg: "#fffbf0" },
    mobileBar: { bg: "#180900", borderBottom: "1px solid rgba(245,158,11,0.12)" },
    sidebar: {
      bg: "linear-gradient(180deg,#180900 0%,#1f0f00 55%,#0f0600 100%)",
      borderRight: "1px solid rgba(245,158,11,0.20)",
      boxShadow: "4px 0 32px rgba(0,0,0,0.55)",
      brandBg: "linear-gradient(135deg,rgba(245,158,11,0.26) 0%,rgba(217,119,6,0.10) 100%)",
      brandBorder: "rgba(245,158,11,0.42)",
      brandBoxShadow: "0 0 20px rgba(245,158,11,0.22),0 2px 8px rgba(0,0,0,0.4)",
      brandIconColor: "#f59e0b",
      brandTextColor: "#fef3c7",
      brandSubColor: "rgba(245,158,11,0.60)",
      statusDotColor: "#f59e0b",
      sectionLabelColor: "rgba(245,158,11,0.52)",
      navActiveBg: "linear-gradient(90deg,rgba(245,158,11,0.18) 0%,rgba(217,119,6,0.05) 100%)",
      navActiveColor: "#fcd34d",
      navHoverBg: "rgba(245,158,11,0.08)",
      navInactiveColor: "rgba(253,211,77,0.42)",
      navIconActive: "#f59e0b",
      navIconInactive: "rgba(245,158,11,0.30)",
      activeBarBg: "linear-gradient(180deg,#fcd34d 0%,#d97706 100%)",
      activeBarShadow: "0 0 14px rgba(245,158,11,0.78)",
      activeAccentDot: "#f59e0b",
      dividerColor: "rgba(245,158,11,0.10)",
      bottomLinkColor: "rgba(253,211,77,0.40)",
      bottomLinkHoverColor: "#fcd34d",
      bottomLinkHoverBg: "rgba(245,158,11,0.08)",
      logoutHoverColor: "rgba(248,113,113,0.85)",
      logoutHoverBg: "rgba(239,68,68,0.08)",
    },
  },
  {
    id: "zebra",
    name: "Zebra",
    emoji: "🦓",
    description: "Bold monochrome — striking power stripes, pure contrast.",
    previewGradient: "repeating-linear-gradient(135deg,#111 0px,#111 8px,#191919 8px,#191919 16px)",
    accentColor: "#ffffff",
    canvas: { bg: "#f4f4f4" },
    mobileBar: { bg: "#111111", borderBottom: "1px solid rgba(255,255,255,0.10)" },
    sidebar: {
      bg: "repeating-linear-gradient(0deg,#0f0f0f 0px,#0f0f0f 16px,#181818 16px,#181818 32px)",
      borderRight: "1px solid rgba(255,255,255,0.16)",
      boxShadow: "4px 0 32px rgba(0,0,0,0.65)",
      brandBg: "linear-gradient(135deg,rgba(255,255,255,0.16) 0%,rgba(255,255,255,0.05) 100%)",
      brandBorder: "rgba(255,255,255,0.30)",
      brandBoxShadow: "0 0 14px rgba(255,255,255,0.10),0 2px 8px rgba(0,0,0,0.4)",
      brandIconColor: "#ffffff",
      brandTextColor: "#ffffff",
      brandSubColor: "rgba(255,255,255,0.50)",
      statusDotColor: "#ffffff",
      sectionLabelColor: "rgba(255,255,255,0.40)",
      navActiveBg: "linear-gradient(90deg,rgba(255,255,255,0.14) 0%,rgba(255,255,255,0.04) 100%)",
      navActiveColor: "#ffffff",
      navHoverBg: "rgba(255,255,255,0.08)",
      navInactiveColor: "rgba(255,255,255,0.48)",
      navIconActive: "#ffffff",
      navIconInactive: "rgba(255,255,255,0.32)",
      activeBarBg: "#ffffff",
      activeBarShadow: "0 0 10px rgba(255,255,255,0.75)",
      activeAccentDot: "#ffffff",
      dividerColor: "rgba(255,255,255,0.10)",
      bottomLinkColor: "rgba(255,255,255,0.42)",
      bottomLinkHoverColor: "#ffffff",
      bottomLinkHoverBg: "rgba(255,255,255,0.08)",
      logoutHoverColor: "rgba(248,113,113,0.85)",
      logoutHoverBg: "rgba(239,68,68,0.08)",
    },
  },
  {
    id: "steel",
    name: "Steel",
    emoji: "⚙️",
    description: "Brushed industrial metal — precision machined, engineered to perfection.",
    previewGradient: "linear-gradient(160deg,#141820 0%,#1b1f26 100%)",
    accentColor: "#94a3b8",
    canvas: { bg: "#eef1f5" },
    mobileBar: { bg: "#141820", borderBottom: "1px solid rgba(148,163,184,0.10)" },
    sidebar: {
      bg: "linear-gradient(180deg,#141820 0%,#181d26 55%,#101420 100%)",
      borderRight: "1px solid rgba(148,163,184,0.14)",
      boxShadow: "4px 0 32px rgba(0,0,0,0.45)",
      brandBg: "linear-gradient(135deg,rgba(148,163,184,0.20) 0%,rgba(100,116,139,0.08) 100%)",
      brandBorder: "rgba(148,163,184,0.30)",
      brandBoxShadow: "0 0 14px rgba(148,163,184,0.12),0 2px 8px rgba(0,0,0,0.35)",
      brandIconColor: "#94a3b8",
      brandTextColor: "#cbd5e1",
      brandSubColor: "rgba(148,163,184,0.55)",
      statusDotColor: "#64748b",
      sectionLabelColor: "rgba(148,163,184,0.50)",
      navActiveBg: "linear-gradient(90deg,rgba(148,163,184,0.16) 0%,rgba(100,116,139,0.04) 100%)",
      navActiveColor: "#e2e8f0",
      navHoverBg: "rgba(148,163,184,0.08)",
      navInactiveColor: "rgba(148,163,184,0.45)",
      navIconActive: "#94a3b8",
      navIconInactive: "rgba(148,163,184,0.30)",
      activeBarBg: "linear-gradient(180deg,#e2e8f0 0%,#64748b 100%)",
      activeBarShadow: "0 0 10px rgba(148,163,184,0.55)",
      activeAccentDot: "#94a3b8",
      dividerColor: "rgba(148,163,184,0.09)",
      bottomLinkColor: "rgba(148,163,184,0.42)",
      bottomLinkHoverColor: "#cbd5e1",
      bottomLinkHoverBg: "rgba(148,163,184,0.07)",
      logoutHoverColor: "rgba(252,165,165,0.85)",
      logoutHoverBg: "rgba(239,68,68,0.08)",
    },
  },
  {
    id: "ivory",
    name: "Ivory",
    emoji: "🦷",
    description: "Warm creamy luxury — timeless ivory draped in burnished gold.",
    previewGradient: "linear-gradient(160deg,#13100a 0%,#1a1510 100%)",
    accentColor: "#e8d5b0",
    canvas: { bg: "#fdf8f0" },
    mobileBar: { bg: "#13100a", borderBottom: "1px solid rgba(232,213,176,0.10)" },
    sidebar: {
      bg: "linear-gradient(180deg,#13100a 0%,#1a1510 55%,#0e0c08 100%)",
      borderRight: "1px solid rgba(232,213,176,0.14)",
      boxShadow: "4px 0 32px rgba(0,0,0,0.45)",
      brandBg: "linear-gradient(135deg,rgba(232,213,176,0.22) 0%,rgba(200,180,140,0.08) 100%)",
      brandBorder: "rgba(232,213,176,0.38)",
      brandBoxShadow: "0 0 16px rgba(232,213,176,0.15),0 2px 8px rgba(0,0,0,0.4)",
      brandIconColor: "#e8d5b0",
      brandTextColor: "#f5ead0",
      brandSubColor: "rgba(232,213,176,0.55)",
      statusDotColor: "#d4a76a",
      sectionLabelColor: "rgba(232,213,176,0.50)",
      navActiveBg: "linear-gradient(90deg,rgba(232,213,176,0.16) 0%,rgba(200,180,140,0.04) 100%)",
      navActiveColor: "#f5ead0",
      navHoverBg: "rgba(232,213,176,0.07)",
      navInactiveColor: "rgba(232,213,176,0.42)",
      navIconActive: "#e8d5b0",
      navIconInactive: "rgba(232,213,176,0.28)",
      activeBarBg: "linear-gradient(180deg,#f5ead0 0%,#c8a87a 100%)",
      activeBarShadow: "0 0 10px rgba(232,213,176,0.62)",
      activeAccentDot: "#e8d5b0",
      dividerColor: "rgba(232,213,176,0.09)",
      bottomLinkColor: "rgba(232,213,176,0.40)",
      bottomLinkHoverColor: "#e8d5b0",
      bottomLinkHoverBg: "rgba(232,213,176,0.07)",
      logoutHoverColor: "rgba(248,113,113,0.80)",
      logoutHoverBg: "rgba(239,68,68,0.07)",
    },
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    emoji: "🌹",
    description: "Blush velvet elegance — warm rose gold on deep crimson obsidian.",
    previewGradient: "linear-gradient(160deg,#120808 0%,#1c0c0c 100%)",
    accentColor: "#f9a8d4",
    canvas: { bg: "#fff0f5" },
    mobileBar: { bg: "#120808", borderBottom: "1px solid rgba(249,168,212,0.10)" },
    sidebar: {
      bg: "linear-gradient(180deg,#120808 0%,#1a0b0b 55%,#0c0505 100%)",
      borderRight: "1px solid rgba(249,168,212,0.16)",
      boxShadow: "4px 0 32px rgba(0,0,0,0.60)",
      brandBg: "linear-gradient(135deg,rgba(249,168,212,0.22) 0%,rgba(244,114,182,0.08) 100%)",
      brandBorder: "rgba(249,168,212,0.38)",
      brandBoxShadow: "0 0 18px rgba(249,168,212,0.18),0 2px 8px rgba(0,0,0,0.4)",
      brandIconColor: "#f9a8d4",
      brandTextColor: "#fce7f3",
      brandSubColor: "rgba(249,168,212,0.58)",
      statusDotColor: "#f472b6",
      sectionLabelColor: "rgba(249,168,212,0.52)",
      navActiveBg: "linear-gradient(90deg,rgba(249,168,212,0.16) 0%,rgba(244,114,182,0.04) 100%)",
      navActiveColor: "#fbcfe8",
      navHoverBg: "rgba(249,168,212,0.08)",
      navInactiveColor: "rgba(249,168,212,0.42)",
      navIconActive: "#f9a8d4",
      navIconInactive: "rgba(249,168,212,0.28)",
      activeBarBg: "linear-gradient(180deg,#fbcfe8 0%,#ec4899 100%)",
      activeBarShadow: "0 0 12px rgba(249,168,212,0.70)",
      activeAccentDot: "#f9a8d4",
      dividerColor: "rgba(249,168,212,0.09)",
      bottomLinkColor: "rgba(249,168,212,0.40)",
      bottomLinkHoverColor: "#f9a8d4",
      bottomLinkHoverBg: "rgba(249,168,212,0.07)",
      logoutHoverColor: "rgba(248,113,113,0.85)",
      logoutHoverBg: "rgba(239,68,68,0.08)",
    },
  },
];
