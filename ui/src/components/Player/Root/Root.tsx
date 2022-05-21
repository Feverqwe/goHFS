import * as React from "react";
import "./Root.less";
import Video from "../Video/Video";
import UrlForm from "../UrlForm/UrlForm";
import UrlFormContext from "../UrlForm/UrlFormContext";

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
    setShowForm(false);
  }, []);

  return (
    <UrlFormContext.Provider value={handleShowForm}>
      <Video url={url} starTime={time}/>
      {!isShowForm ? null : (
        <UrlForm onSubmit={handleUrlFormSubmit}/>
      )}
    </UrlFormContext.Provider>
  );
});

export default Root;