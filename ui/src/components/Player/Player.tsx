import * as React from 'react';
import {useState} from 'react';
import {GlobalStyles} from '@mui/material';
import {Theme} from '@mui/material/styles';
import UrlDialog from './components/UrlDialog/UrlDialog';
import UrlDialogCtx from './components/UrlDialog/UrlDialogCtx';
import {changeUrlParams} from '../../tools/urlParams';
import {getParamsFromUrl} from './utils';
import FetchMetadata from './components/FetchMetadata/FetchMetadata';
import {VideoMetadata} from './types';
import Video2 from './components/Video2/Video2';
import PlaylistFromSource from './components/Playlist/PlaylistFromSource';

const RootStyles = (theme: Theme) => ({
  html: {
    backgroundColor: theme.palette.common.black,
    width: '100%',
    height: '100%',
  },
  body: {
    backgroundColor: 'inherit',
    margin: 0,
    width: '100%',
    height: '100%',
  },
  '#root': {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
});

const Player = React.memo(() => {
  const {url} = getParamsFromUrl();
  const [playlistSource, setPlaylistSource] = useState(() =>
    new URLSearchParams(location.search).get('playlist'),
  );
  const [isShowDialog, setShowDialog] = React.useState(!url && playlistSource === null);
  const [, render] = useState({});

  const toggleDialog = React.useCallback(() => {
    setShowDialog((v) => !v);
  }, []);

  const handleClose = React.useCallback(() => {
    setShowDialog(false);
  }, []);

  const handleChangeUrl = React.useCallback(
    (nextUrl: string) => {
      if (playlistSource !== null) {
        const page = new URL(location.href);
        page.searchParams.delete('playlist');
        page.searchParams.set('url', nextUrl);
        history.replaceState(null, '', page);
        setPlaylistSource(null);
        return;
      }
      changeUrlParams({url: nextUrl});
      render({});
    },
    [playlistSource],
  );

  return (
    <UrlDialogCtx.Provider value={toggleDialog}>
      <GlobalStyles styles={RootStyles} />
      {playlistSource !== null && <PlaylistFromSource source={playlistSource} />}
      {playlistSource === null && url ? (
        <FetchMetadata url={url}>
          {(metadata) => <Video2 metadata={metadata as VideoMetadata} url={url} />}
        </FetchMetadata>
      ) : null}
      {isShowDialog ? <UrlDialog onClose={handleClose} onSubmit={handleChangeUrl} /> : null}
    </UrlDialogCtx.Provider>
  );
});

export default Player;
