export const COLOR_SCHEMES = {
  // Single color gradients
  teal: [
    '#134e4a', // Darkest
    '#0f766e',
    '#0d9488',
    '#14b8a6',
    '#2dd4bf',
    '#5eead4',
    '#99f6e4',
    '#ccfbf1', // Lightest
  ],
  blue: [
    '#1e3a8a',
    '#1e40af',
    '#1d4ed8',
    '#2563eb',
    '#3b82f6',
    '#60a5fa',
    '#93c5fd',
    '#bfdbfe',
  ],
  red: [
    '#7f1d1d',
    '#991b1b',
    '#dc2626',
    '#ef4444',
    '#f87171',
    '#fca5a5',
    '#fecaca',
    '#fee2e2',
  ],
  
  // Multi-color gradients
  viridis: [
    '#440154', // Purple
    '#414487', // Blue-purple
    '#2a788e', // Blue-green
    '#22a884', // Green
    '#7ad151', // Yellow-green
    '#fde725', // Yellow
    '#fee08b', // Light yellow
    '#ffffd9', // Pale yellow
  ],
  plasma: [
    '#0d0887', // Deep purple
    '#5302a3', // Purple
    '#8b0aa5', // Magenta
    '#b83289', // Pink
    '#db5c68', // Red-pink
    '#f48849', // Orange
    '#febc2a', // Yellow
    '#f0f921', // Bright yellow
  ],
  inferno: [
    '#000004', // Black
    '#1b0c41', // Deep purple
    '#4a0c6b', // Purple
    '#781c6d', // Magenta
    '#a52c60', // Pink
    '#cf4446', // Red
    '#ed6925', // Orange
    '#fbb32f', // Yellow
  ],
  turbo: [
    '#30123b', // Deep purple
    '#4145ab', // Blue
    '#4675ed', // Light blue
    '#39a2fc', // Cyan
    '#1bcfd4', // Teal
    '#24db89', // Green
    '#6dea3c', // Lime
    '#fffc4d', // Yellow
  ],
  spectral: [
    '#9e0142', // Dark red
    '#d53e4f', // Red
    '#f46d43', // Orange
    '#fdae61', // Light orange
    '#abdda4', // Light green
    '#66c2a5', // Teal
    '#3288bd', // Blue
    '#5e4fa2', // Purple
  ],
  coolwarm: [
    '#3b4cc0', // Deep blue
    '#6688ee', // Blue
    '#88b0f6', // Light blue
    '#b4d0f6', // Pale blue
    '#f4c4a8', // Pale red
    '#f4a088', // Light red
    '#e56c5e', // Red
    '#b40426', // Deep red
  ]
} as const;

export type ColorScheme = keyof typeof COLOR_SCHEMES; 