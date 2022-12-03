import * as React from 'react';
import {useState} from 'react';
import {GlobalStyles} from '@mui/material';
import Video from './Video/Video';
import UrlDialog from './UrlDialog/UrlDialog';
import UrlDialogCtx from './UrlDialog/UrlDialogCtx';
import {changeUrlParams} from '../../tools/urlParams';
import {getParamsFromUrl} from './utils';
import FetchMetadata from './FetchMetadata/FetchMetadata';
import {VideoMetadata} from './types';

const RootStyles = {
  html: {
    backgroundColor: '#000',
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
  },
};

const Player = React.memo(() => {
  const {url} = getParamsFromUrl();
  const [isShowDialog, setShowDialog] = React.useState(!url);
  const [, render] = useState({});

  const toggleDialog = React.useCallback(() => {
    setShowDialog((v) => !v);
  }, []);

  const handleClose = React.useCallback(() => {
    setShowDialog(false);
  }, []);

  const handleChangeUrl = React.useCallback((url: string) => {
    changeUrlParams({url});
    render({});
  }, []);

  return (
    <UrlDialogCtx.Provider value={toggleDialog}>
      <GlobalStyles styles={RootStyles} />
      {url ? (
        <FetchMetadata url={url}>
          {(metadata) => (
            <Video metadata={metadata as VideoMetadata} url={url} />
          )}
        </FetchMetadata>
      ) : null}
      {isShowDialog ? (
        <UrlDialog onClose={handleClose} onSubmit={handleChangeUrl} />
      ) : null}
    </UrlDialogCtx.Provider>
  );
});

export default Player;
