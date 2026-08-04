import {styled} from '@mui/material';

const PlayerContainer = styled('div')(({theme}) => ({
  width: '100%',
  height: '100%',

  '.video-js': {
    width: '100%',
    height: '100%',
    fontFamily: theme.typography.fontFamily,
  },

  '.video-js.vjs-mobile-touch': {
    touchAction: 'manipulation',
  },

  '.video-js.vjs-mobile-touch .vjs-big-play-button': {
    width: '2em',
    height: '2em',
    marginTop: '-1em',
    marginLeft: '-1em',
    border: 0,
    borderRadius: '50%',
    backgroundColor: '#6668ab',
    lineHeight: '2em',

    '&:active': {
      transform: 'scale(0.9)',
    },
  },

  '.video-js .vjs-control-bar': {
    height: '4.5em',
    padding: '0 0.8em',
    alignItems: 'center',
    boxSizing: 'border-box',
    backgroundColor: 'transparent',

    '&::before': {
      position: 'absolute',
      top: '-3em',
      right: 0,
      bottom: 0,
      left: 0,
      background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.65))',
      content: '""',
      pointerEvents: 'none',
    },
  },

  '.video-js .vjs-control': {
    width: '4.5em',
  },

  '.video-js .vjs-button > .vjs-icon-placeholder::before': {
    fontSize: '2.4em',
    lineHeight: 1.875,
  },

  '.video-js .vjs-time-control, .video-js .vjs-time-divider': {
    display: 'flex',
    alignItems: 'center',
    padding: '0 0.35em',
    fontSize: '1.575em',
    lineHeight: 1,
    width: 'auto',
    minWidth: 'auto',
  },

  '.video-js .vjs-time-divider': {
    padding: '0',
  },

  '.video-js  .vjs-volume-horizontal': {
    margin: '8px 0',
  },

  '.video-js .vjs-current-time, .video-js .vjs-time-divider, .video-js .vjs-duration': {
    display: 'flex',
  },

  '.video-js.vjs-layout-small .vjs-current-time, .video-js.vjs-layout-small .vjs-time-divider, .video-js.vjs-layout-small .vjs-duration':
    {
      display: 'flex',
    },

  '.video-js .vjs-menu-button-popup .vjs-menu': {
    bottom: '28px',
    marginBottom: '1.2em',
  },

  '.video-js .vjs-menu-button-popup .vjs-menu .vjs-menu-content': {
    bottom: 0,
    borderRadius: '0.2em',
    backgroundColor: 'rgba(28, 28, 28, 0.92)',
    fontFamily: theme.typography.fontFamily,
  },

  '.video-js .vjs-playback-rate.vjs-menu-button-popup .vjs-menu .vjs-menu-content': {
    width: 'auto',
  },

  '.video-js .vjs-subs-caps-button .vjs-menu, .video-js .vjs-audio-button .vjs-menu': {
    right: 0,
    left: 'auto',
    width: 'max-content',
    minWidth: '12em',
    maxWidth: 'calc(100vw - 2.4em)',
  },

  '.video-js .vjs-menu li': {
    justifyContent: 'flex-start',
    padding: '0.45em 0.8em',
    fontSize: '1.4em',
    textAlign: 'left',
    textTransform: 'none',
  },

  '.video-js .vjs-time-tooltip, .video-js .vjs-volume-tooltip': {
    fontFamily: theme.typography.fontFamily,
  },

  '.video-js .vjs-progress-control:hover .vjs-mouse-display .vjs-time-tooltip, .video-js .vjs-progress-control:hover .vjs-play-progress .vjs-time-tooltip, .video-js.vjs-scrubbing.vjs-touch-enabled .vjs-progress-control .vjs-time-tooltip':
    {
      fontSize: '13px',
    },

  '.video-js .vjs-progress-control:hover .vjs-mouse-display .vjs-time-tooltip': {
    backgroundColor: 'rgba(28, 28, 28, .9)',
  },

  '.video-js .vjs-custom-control-spacer': {
    display: 'block',
    flex: '1 1 auto',
  },

  '.video-js .vjs-progress-control': {
    position: 'absolute',
    top: '-1.5em',
    right: '1.2em',
    left: '1.2em',
    display: 'flex',
    width: 'auto',
    height: '3em',
  },

  '.video-js .vjs-progress-control .vjs-progress-holder': {
    height: '0.5em',
    margin: 0,
  },

  '.video-js .vjs-progress-control:hover .vjs-progress-holder, .video-js.vjs-scrubbing.vjs-touch-enabled .vjs-progress-control .vjs-progress-holder':
    {
      fontSize: '1.4em',
    },

  '.video-js.vjs-layout-x-small .vjs-progress-control, .video-js.vjs-layout-tiny .vjs-progress-control':
    {
      display: 'flex',
    },

  '.video-js .vjs-play-progress:before': {
    lineHeight: '0.6em',
  },

  '.vjs-playback-rate > .vjs-menu-button, .vjs-playback-rate .vjs-playback-rate-value': {
    lineHeight: '45px',
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
