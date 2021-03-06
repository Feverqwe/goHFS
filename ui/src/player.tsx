import * as React from "react";
import Root from "./components/Player/Root/Root";
import {CacheProvider} from "@emotion/react";
import cache from "./tools/muiCache";
import {CssBaseline, ThemeProvider} from "@mui/material";
import theme from "./tools/muiTheme";
import {createRoot} from "react-dom/client";

const root = createRoot(document.getElementById('root')!);

root.render(
  <CacheProvider value={cache}>
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <Root/>
    </ThemeProvider>
  </CacheProvider>
);
