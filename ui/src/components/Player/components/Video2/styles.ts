import {styled} from '@mui/material';
import {alpha} from '@mui/material/styles';

const getSubtitleShadow = (color: string) =>
  [
    '0.03em 0 0.03em',
    '0 0.03em 0.03em',
    '-0.03em 0 0.03em',
    '0 -0.03em 0.03em',
    '0.03em 0.03em 0.03em',
    '-0.03em -0.03em 0.03em',
    '0.03em -0.03em 0.03em',
    '-0.03em 0.03em 0.03em',
  ]
    .map((shadow) => `${shadow} ${color}`)
    .join(', ');

const PlayerContainer = styled('div')(({theme}) => ({
  width: '100%',
  height: '100%',

  '.video-js': {
    display: 'block',
    width: '100%',
    height: '100%',
    color: theme.palette.common.white,
    backgroundColor: theme.palette.common.black,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.pxToRem(12),
  },

  '.video-js .vjs-tech': {
    objectFit: 'contain',
  },

  '.video-js .vjs-poster img': {
    display: 'block',
  },

  '.video-js.vjs-mobile-touch': {
    touchAction: 'manipulation',
  },

  '.video-js:focus, .video-js .vjs-tech:focus': {
    outline: 'none',
  },

  '.video-js .vjs-control:focus, .video-js .vjs-control:focus::before, .video-js .vjs-slider:focus':
    {
      boxShadow: 'none',
      textShadow: 'none',
    },

  '.video-js .vjs-control:focus .vjs-svg-icon': {
    filter: 'none',
  },

  '.video-js.vjs-user-inactive.vjs-playing': {
    cursor: 'none',
  },

  '.video-js .vjs-big-play-button': {
    fontSize: '2.5em',
    width: '2em',
    height: '2em',
    marginTop: '-1em',
    marginLeft: '-1em',
    border: 0,
    borderRadius: '50%',
    backgroundColor: alpha(theme.palette.primary.main, 0.88),
    color: theme.palette.primary.contrastText,
    lineHeight: '2em',
  },

  '.video-js:hover .vjs-big-play-button, .video-js .vjs-big-play-button:focus': {
    borderColor: theme.palette.primary.light,
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
  },

  '.video-js.vjs-mobile-touch .vjs-big-play-button': {
    backgroundColor: theme.palette.primary.main,

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
      background: `linear-gradient(transparent, ${alpha(theme.palette.common.black, 0.65)})`,
      content: '""',
      pointerEvents: 'none',
    },
  },

  '.video-js.vjs-layout-small .vjs-control-bar, .video-js.vjs-layout-x-small .vjs-control-bar': {
    paddingRight: 0,
    paddingLeft: 0,
  },

  '.video-js.vjs-layout-small .vjs-control.vjs-button, .video-js.vjs-layout-x-small .vjs-control.vjs-button':
    {
      marginRight: '0.25em',
      marginLeft: '0.25em',
    },

  '.video-js.vjs-layout-small .vjs-time-control, .video-js.vjs-layout-small .vjs-time-divider': {
    fontSize: '1.25em',
  },

  '.video-js .vjs-control': {
    width: '4.5em',
  },

  '.video-js .vjs-control.vjs-button': {
    width: '3.667em',
    height: '3.667em',
    margin: '0.4165em',
  },

  '.video-js .vjs-button:focus-visible, .video-js .vjs-slider:focus-visible': {
    outline: `2px solid ${theme.palette.primary.light}`,
    outlineOffset: '2px',
    boxShadow: `0 0 0 2px ${alpha(theme.palette.common.black, 0.45)}`,
  },

  '.video-js .vjs-button > .vjs-icon-placeholder::before': {
    fontSize: '2.4em',
    lineHeight: 1.458,
  },

  '.video-js .vjs-settings-button': {
    cursor: 'pointer',
    flex: 'none',
  },

  '.video-js .vjs-time-control, .video-js .vjs-time-divider': {
    display: 'flex',
    alignItems: 'center',
    padding: '0 0.35em',
    fontSize: '1.4em',
    lineHeight: 1,
    width: 'auto',
    minWidth: 'auto',
  },

  '.video-js .vjs-time-divider': {
    padding: '0',
  },

  '.video-js  .vjs-volume-horizontal': {
    margin: '0.8em 0',
  },

  '.video-js .vjs-volume-panel.vjs-volume-panel-horizontal:focus-within': {
    width: '10em',
    transition: 'width 120ms ease-out',
  },

  '.video-js .vjs-volume-panel:focus-within .vjs-volume-control.vjs-volume-horizontal': {
    position: 'relative',
    width: '5em',
    height: '3em',
    marginRight: 0,
    visibility: 'visible',
    opacity: 1,
    transition: 'visibility 0s, opacity 120ms ease-out, width 120ms ease-out',
  },

  '.video-js .vjs-current-time, .video-js .vjs-time-divider, .video-js .vjs-duration': {
    display: 'flex',
  },

  '.video-js.vjs-layout-small .vjs-current-time, .video-js.vjs-layout-small .vjs-time-divider, .video-js.vjs-layout-small .vjs-duration':
    {
      display: 'flex',
    },

  '.video-js.vjs-layout-x-small .vjs-current-time': {
    display: 'flex',
    paddingRight: '0.2em',
    paddingLeft: '0.2em',
    fontSize: '1.25em',
  },

  '.video-js.vjs-layout-x-small .vjs-time-divider, .video-js.vjs-layout-x-small .vjs-duration': {
    display: 'none',
  },

  '@media (max-width: 255px)': {
    '.video-js.vjs-layout-x-small .vjs-current-time': {
      display: 'none',
    },
  },

  '.video-js .vjs-menu-button-popup .vjs-menu': {
    zIndex: 3,
    bottom: '2.8em',
    marginBottom: '1.2em',
  },

  '.video-js .vjs-menu-button-popup.vjs-hover, .video-js .vjs-menu-button-popup:focus-within': {
    zIndex: 3,
  },

  '.video-js .vjs-menu-button-popup .vjs-menu .vjs-menu-content': {
    bottom: 0,
    borderRadius: '0.2em',
    backgroundColor: alpha(theme.palette.background.paper, 0.92),
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
    fontSize: '1.2em',
    textAlign: 'left',
    textTransform: 'none',
  },

  '.video-js .vjs-menu li.vjs-menu-item:hover': {
    backgroundColor: theme.palette.action.hover,
  },

  '.video-js .vjs-menu li.vjs-selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },

  '.video-js .vjs-time-tooltip, .video-js .vjs-volume-tooltip': {
    backgroundColor: alpha(theme.palette.background.paper, 0.92),
    color: theme.palette.text.primary,
    fontFamily: theme.typography.fontFamily,
  },

  '.video-js .vjs-progress-control:hover .vjs-mouse-display .vjs-time-tooltip, .video-js.vjs-scrubbing.vjs-touch-enabled .vjs-progress-control .vjs-mouse-display .vjs-time-tooltip':
    {
      fontSize: '0.93em',
    },

  '.video-js .vjs-mouse-display .vjs-time-tooltip': {
    top: '-2.8em',
  },

  '.video-js .vjs-progress-control:hover .vjs-mouse-display .vjs-time-tooltip': {
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
  },

  '.video-js .vjs-volume-control:hover .vjs-volume-tooltip, .video-js .vjs-volume-control:hover .vjs-progress-holder:focus .vjs-volume-tooltip':
    {
      fontSize: '1.3em',
    },

  '.video-js .vjs-custom-control-spacer': {
    display: 'block',
    flex: '1 1 auto',
  },

  '.video-js .vjs-slider': {
    backgroundColor: alpha(theme.palette.common.white, 0.2),
  },

  '.video-js .vjs-volume-bar': {
    height: '0.4em',
    margin: '1.3em 0.45em',
    backgroundColor: alpha(theme.palette.common.white, 0.3),
  },

  '.video-js .vjs-volume-level': {
    height: '0.4em',
    backgroundColor: theme.palette.primary.main,
  },

  '.video-js .vjs-volume-level::before': {
    lineHeight: '0.5em',
  },

  '.video-js .vjs-load-progress, .video-js .vjs-load-progress div': {
    backgroundColor: alpha(theme.palette.common.white, 0.1),
  },

  '.video-js .vjs-progress-control': {
    position: 'absolute',
    zIndex: 2,
    top: '-1.8335em',
    right: '1.2em',
    left: '1.2em',
    display: 'flex',
    width: 'auto',
    height: '3.667em',
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

  '.video-js .vjs-play-progress': {
    backgroundColor: theme.palette.primary.main,
  },

  '@media (prefers-reduced-motion: reduce)': {
    '.video-js .vjs-volume-panel, .video-js .vjs-volume-control, .video-js .vjs-custom-subtitles': {
      transition: 'none',
    },

    '.video-js.vjs-mobile-touch .vjs-big-play-button:active': {
      transform: 'none',
    },
  },

  '.vjs-playback-rate > .vjs-menu-button': {
    lineHeight: '4.5em',
  },

  '.vjs-playback-rate .vjs-playback-rate-value': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4em',
    lineHeight: 1,
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
    color: theme.palette.common.white,
    fontSize: '2.917em',
    lineHeight: 'initial',
    textAlign: 'center',
    textShadow: getSubtitleShadow(theme.palette.common.black),
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
    color: theme.palette.common.white,
    fontSize: '1.65em',
    transition: 'margin 0.2s',
  },

  '.vjs-user-inactive.vjs-playing .vjs-notice': {
    marginTop: 0,
  },

  '.vjs-notice-text': {
    padding: '0.32em 0.64em',
    borderRadius: '0.13em',
    background: alpha(theme.palette.background.paper, 0.9),
    fontSize: '0.875em',
    userSelect: 'all',
  },

  '.vjs-notice-visible': {
    display: 'block',
  },

  '.vjs-fullscreen .vjs-notice': {
    fontSize: '2.017em',
  },
}));

export default PlayerContainer;
