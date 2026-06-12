// AutoGo Partners - Design System Colors
// Dark mode with Partner Gold/Emerald accents

export const colors = {
  // Primary backgrounds
  background: {
    primary: '#0A1520',
    secondary: '#0D1F2D',
    card: 'rgba(13, 43, 45, 0.6)',
    cardBorder: 'rgba(45, 212, 191, 0.15)',
    glass: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    dark: '#060E17',
    darkCard: '#0E1A27',
    elevated: '#111D2A',
  },

  // Gradients
  gradient: {
    primary: ['#0A1520', '#0D2B2D', '#0A1520'] as const,
    card: ['rgba(13, 59, 58, 0.7)', 'rgba(10, 21, 32, 0.8)'] as const,
    header: ['#0A1520', 'rgba(10, 21, 32, 0.0)'] as const,
    gold: ['#D4A056', '#C4842D'] as const,
    emerald: ['#10B981', '#059669'] as const,
    danger: ['#EF4444', '#DC2626'] as const,
  },

  // Accent - Partner Gold (distinguishes from customer app)
  accent: {
    primary: '#D4A056',       // Partner Gold
    secondary: '#E8B86D',     // Light Gold
    emerald: '#10B981',       // Emerald Green
    emeraldDark: '#059669',
    teal: '#2DD4BF',
    tealDark: '#0D9488',
    glow: 'rgba(212, 160, 86, 0.3)',
    emeraldGlow: 'rgba(16, 185, 129, 0.3)',
  },

  // Status colors
  status: {
    online: '#10B981',
    offline: '#6B7280',
    busy: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    pending: '#F59E0B',
    inProgress: '#3B82F6',
    completed: '#10B981',
  },

  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    accent: '#D4A056',
    dark: '#1A202C',
    muted: 'rgba(255, 255, 255, 0.35)',
    gold: '#D4A056',
    emerald: '#10B981',
  },

  // Input
  input: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(212, 160, 86, 0.25)',
    borderFocused: '#D4A056',
    placeholder: 'rgba(255, 255, 255, 0.35)',
    text: '#FFFFFF',
  },

  // Buttons
  button: {
    primary: '#D4A056',
    primaryText: '#0A1520',
    secondary: 'rgba(255, 255, 255, 0.08)',
    secondaryText: '#FFFFFF',
    danger: '#EF4444',
    dangerText: '#FFFFFF',
    success: '#10B981',
    successText: '#FFFFFF',
    disabled: 'rgba(212, 160, 86, 0.3)',
    disabledText: 'rgba(255, 255, 255, 0.4)',
  },

  // Tab bar
  tab: {
    background: '#0E1A27',
    active: '#D4A056',
    inactive: 'rgba(255, 255, 255, 0.35)',
  },

  // Role-specific
  role: {
    winch: '#F59E0B',
    winchGlow: 'rgba(245, 158, 11, 0.2)',
    workshop: '#10B981',
    workshopGlow: 'rgba(16, 185, 129, 0.2)',
  },

  // Misc
  overlay: 'rgba(0, 0, 0, 0.6)',
  divider: 'rgba(255, 255, 255, 0.08)',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export default colors;
