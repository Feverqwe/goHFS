import * as React from 'react';
import {useState} from 'react';
import {GlobalStyles} from '@mui/material';
import Video from '../Video/Video';
import UrlForm from '../UrlForm/UrlForm';
import UrlFormContext from '../UrlForm/UrlFormContext';
import {changeUrlParams} from '../../../tools/urlParams';
import {getParamsFromUrl} from './utils';

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

const Root = React.memo(() => {
  const [{url, time}, setUrlTime] = useState(getParamsFromUrl);
  const [isShowForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    if (!url) {
      setShowForm(true);
    }
  }, [url]);

  const handleShowForm = React.useCallback(() => {
    setShowForm((v) => !v);
  }, []);

  const handleClose = React.useCallback(() => {
    setShowForm(false);
  }, []);

  const handleUrlFormSubmit = React.useCallback((url: string) => {
    changeUrlParams({url, time: String(0)});
    setUrlTime(getParamsFromUrl());
    handleClose();
  }, [handleClose]);

  return (
    <UrlFormContext.Provider value={handleShowForm}>
      <GlobalStyles styles={RootStyles} />
      <Video url={url} starTime={time} />
      {isShowForm ? (
        <UrlForm onCancel={url && handleClose || undefined} onSubmit={handleUrlFormSubmit} />
      ) : null}
    </UrlFormContext.Provider>
  );
});

export default Root;
