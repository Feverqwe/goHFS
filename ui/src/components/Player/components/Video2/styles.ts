import {styled} from '@mui/material';

const PlayerContainer = styled('div')(() => ({
  width: '100%',
  height: '100%',

  '.video-js': {
    width: '100%',
    height: '100%',
  },

  '.vjs-notice': {
    position: 'absolute',
    zIndex: 3,
    top: '1em',
    left: '1em',
    maxWidth: '80%',
    padding: '0.55em 0.85em',
    borderRadius: '0.25em',
    color: '#fff',
    background: 'rgba(0, 0, 0, 0.72)',
    fontSize: '1.35em',
    opacity: 0,
    pointerEvents: 'none',
  },

  '.vjs-notice-visible': {
    opacity: 1,
  },
}));

export default PlayerContainer;
