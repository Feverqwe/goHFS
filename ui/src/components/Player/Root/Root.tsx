import * as React from "react";
import Video from "../Video/Video";
import UrlForm from "../UrlForm/UrlForm";
import UrlFormContext from "../UrlForm/UrlFormContext";
import {GlobalStyles} from "@mui/material";

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
  }
};

const Root = React.memo(() => {
  const [url, setUrl] = React.useState('');
  const [time, setTime] = React.useState(0);
  const [isShowForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    const uri = new URL(location.href);
    const url = uri.searchParams.get('url');
    const time = uri.searchParams.get('t');
    if (time && /^\d+$/.test(time)) {
      setTime(parseInt(time, 10));
    }
    if (url) {
      setUrl(url);
    } else {
      setShowForm(true);
    }
  },[]);

  const handleShowForm = React.useCallback(() => {
    setShowForm(v => !v);
  }, []);

  const handleUrlFormSubmit = React.useCallback((url: string) => {
    setUrl(url);
    setTime(0);
    handleClose();
  }, []);

  const handleClose = React.useCallback(() => {
    setShowForm(false);
  }, []);

  return (
    <UrlFormContext.Provider value={handleShowForm}>
      <GlobalStyles styles={RootStyles} />
      <Video url={url} starTime={time}/>
      {isShowForm ? (
        <UrlForm onCancel={url && handleClose || undefined} onSubmit={handleUrlFormSubmit}/>
      ) : null}
    </UrlFormContext.Provider>
  );
});

export default Root;