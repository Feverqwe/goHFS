export const DEBUG_EVENTS = false;
export const DOUBLE_TAP_DELAY = 300;
export const NOTICE_DURATION = 1800;
export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3];
export const SAVE_INTERVAL = 3 * 1000;
export const TAP_MAX_DURATION = 300;
export const TAP_MAX_MOVEMENT = 24;
export const TAP_ZONE_WIDTH = 1 / 3;
export const SHORT_SKIP = 3;
export const SKIP = 10;
export const VOLUME_STEP = 0.05;

export const DEBUG_EVENT_TYPES = [
  'abort',
  'canplay',
  'canplaythrough',
  'durationchange',
  'emptied',
  'ended',
  'error',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'pause',
  'play',
  'playing',
  'ratechange',
  'seeked',
  'seeking',
  'stalled',
  'volumechange',
  'waiting',
] as const;
