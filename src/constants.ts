// Canvas constants
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 5;
export const SCALE_FACTOR = 0.05; // Amount to change scale per zoom step
export const DEFAULT_ITEM_WIDTH = 200;
export const DEFAULT_ITEM_HEIGHT = 150;

// Item types
export const ITEM_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  SHAPE: 'shape',
  GROUP: 'group',
} as const;

// Default values
export const DEFAULT_FONT_SIZE = 16;
export const DEFAULT_FONT_FAMILY = 'Arial, sans-serif';

export const DRAG_RESISTANCE = 0.8;
export const PRELOAD_VIEWPORT_MARGIN = 500; // px beyond viewport to preload items

// Item quality thresholds based on scale
export const QUALITY_THRESHOLD_LOW = 0.5;
export const QUALITY_THRESHOLD_MED = 1.0;
export const QUALITY_THRESHOLD_HIGH = 2.0;

// Animation spring config
export const SPRING_CONFIG = {
  stiffness: 300,
  damping: 30,
  mass: 1
};

// Item interaction states
export const ITEM_STATE = {
  NORMAL: 'normal',
  HOVER: 'hover',
  SELECTED: 'selected'
};

// Grid settings
export const GRID_SIZE = 20; // px
export const SNAP_THRESHOLD = 10; // px

// Item constants
export const ITEM_SIZE = 250;
export const ITEM_PADDING = 20;

// Preload thresholds
export const PRELOAD_TIMEOUT = 5000; // 5 seconds timeout for loading images

// Animation constants
export const ANIMATION_DURATION = 0.5;
export const HOVER_SCALE = 1.05;

// Image cache constants
export const MAX_CACHE_SIZE = 300; // Maximum number of images to keep in memory
export const CACHE_CLEANUP_INTERVAL = 60000; // Clean cache every minute 