import * as React from "react";
import {SyntheticEvent} from "react";
import "./UrlForm.less";

interface UrlFormProps {
  onCancel?: () => void,
  onSubmit?: (url: string) => void,
}

const UrlForm = React.memo(({onCancel, onSubmit}: UrlFormProps) => {
  const handleSubmit = React.useCallback((e: SyntheticEvent<HTMLFormElement>) => {
    if (onSubmit) {
      e.preventDefault();
      const urlInput = e.currentTarget.elements['url' as keyof HTMLFormControlsCollection] as HTMLInputElement;
      const url = urlInput.value;
      onSubmit(url);
    }
  }, []);

  const handleCancel = React.useCallback(() => {
    onCancel && onCancel()
  }, []);

  return (
    <div className={"form-backdrop"}>
      <div className={"form-container"}>
        <form className={"url-form"} method={"GET"} onSubmit={handleSubmit}>
          <input name={"url"} className={"url-input"} type="text" required autoFocus />
          <button type="submit">Open</button>
          {onCancel && (
            <button type={"button"} onClick={handleCancel}>Close</button>
          )}
        </form>
      </div>
    </div>
  );
});

export default UrlForm;