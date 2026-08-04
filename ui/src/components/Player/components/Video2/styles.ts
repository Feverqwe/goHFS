import {styled} from '@mui/material';

const PlayerContainer = styled('div')(() => ({
  width: '100%',
  height: '100%',

  '.video-js': {
    width: '100%',
    height: '100%',
  },

  '.vjs-text-track-display': {
    display: 'none',
  },

  '.vjs-custom-subtitles': {
    position: 'absolute',
    zIndex: 2,
    right: '2%',
    bottom: '2%',
    left: '2%',
    marginBottom: '2.2em',
    color: '#fff',
    fontSize: '3.5em',
    lineHeight: 'initial',
    textAlign: 'center',
    textShadow:
      '1px 0 1px #000, 0 1px 1px #000, -1px 0 1px #000, 0 -1px 1px #000, 1px 1px 1px #000, -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000',
    pointerEvents: 'none',
    transition: 'margin 0.3s',

    p: {
      margin: 0,
    },

    span: {
      padding: '0 0.25em',
      cursor: 'text',
      pointerEvents: 'auto',
      userSelect: 'text',
      whiteSpace: 'pre-wrap',
    },
  },

  '.vjs-user-inactive.vjs-playing .vjs-custom-subtitles': {
    marginBottom: 0,
  },

  '.vjs-notice': {
    position: 'absolute',
    display: 'none',
    zIndex: 9,
    top: '0.625em',
    right: '0.625em',
    left: '0.625em',
    color: '#fff',
    fontSize: '1.8em',
    transition: 'margin 0.2s',
  },

  '.vjs-user-inactive.vjs-playing .vjs-notice': {
    marginTop: 0,
  },

  '.vjs-notice-text': {
    padding: '5px 10px',
    borderRadius: '2px',
    background: 'rgba(28, 28, 28, 0.9)',
    fontSize: '0.875em',
    userSelect: 'all',
  },

  '.vjs-notice-visible': {
    display: 'block',
  },

  '.vjs-fullscreen .vjs-notice': {
    fontSize: '2.2em',
  },
}));

export default PlayerContainer;
