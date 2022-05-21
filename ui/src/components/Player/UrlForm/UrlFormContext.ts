import * as React from "react";

const UrlFormContext = React.createContext<() => void>(() => {});

export default UrlFormContext;