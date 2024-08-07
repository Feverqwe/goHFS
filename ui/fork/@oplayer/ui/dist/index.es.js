/**
 * name: @oplayer/ui
 * version: v1.2.34
 * description: ui plugin for oplayer
 * author: shiyiya
 * homepage: https://github.com/shiyiya/oplayer
 */
var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5, _templateObject6, _templateObject7, _templateObject8;
function _taggedTemplateLiteralLoose(strings, raw) {
  if (!raw) {
    raw = strings.slice(0);
  }
  strings.raw = raw;
  return strings;
}
import { $, isMobile, isSafari, isIOS, mergeDeep } from "../../core/dist/index.es.js";
const loading = $.cls("loading");
const playing = $.cls("playing");
const focused = $.cls("focused");
const fullscreen = $.cls("fullscreen");
const settingShown = $.cls("settingShown");
const hidden$1 = $.css("display:none");
const DATA_CONTROLLER_HIDDEN = "data-ctrl-hidden";
const controllerHidden = $.css({
  ["." + playing]: {
    cursor: "none"
  }
});
const error = $.cls("error");
const root = (config) => {
  return $.css(Object.assign({
    "--primary-color": "" + config.theme.primaryColor,
    "--shadow-background-color": "rgba(28 ,28 ,28 , .9)",
    "--control-bar-height": config.controlBar ? "2.5em" : 0,
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    "line-height": 1,
    "font-size": isMobile ? "16px" : "18px",
    "&, & > *": {
      "-webkit-tap-highlight-color": "rgba(0, 0, 0, 0)"
    },
    "& [hidden]": {
      display: "none"
    }
  }, {
    ["@global ." + webFullScreen + " &"]: {
      "font-size": isMobile ? "18px" : "22px"
    },
    ["@global ." + fullscreen + " &"]: {
      "font-size": isMobile ? "18px" : "22px"
    }
  }));
};
const webFullScreen = $.css(_templateObject || (_templateObject = _taggedTemplateLiteralLoose(["\n  z-index: 99 !important;\n  position: fixed !important;\n  left: 0;\n  right: 0;\n  top: 0;\n  bottom: 0;"])));
const icon = $.css({
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
  outline: "none",
  font: "inherit",
  color: "inherit",
  "line-height": "inherit",
  "text-align": "inherit",
  width: "100%",
  "-webkit-tap-highlight-color": "transparent",
  "user-select": "none"
});
const on = $.css({
  "& > *:nth-child(1)": {
    display: "none"
  }
});
const off = $.css({
  "& > *:nth-child(2)": {
    display: "none"
  }
});
const tooltip = isMobile ? "" : $.css({
  position: "relative",
  "&:hover": {
    "&::after": {
      opacity: 1,
      transform: "translateX(-50%) scale(1)"
    },
    "&:not([data-tooltip-pos]):last-child::after": {
      right: 0,
      left: "auto",
      transform: "translateY(0) scale(1)"
    },
    "&[data-tooltip-pos=down]::after": {
      transform: "translateX(-50%) scale(1)"
    },
    "&[data-tooltip-pos=down]:last-child::after": {
      right: 0,
      transform: "translateY(0) scale(1)"
    }
  },
  "&::after": {
    position: "absolute",
    content: "attr(aria-label)",
    bottom: "100%",
    left: "50%",
    "margin-bottom": "0.5em",
    "white-space": "nowrap",
    background: "var(--shadow-background-color)",
    transform: "translate(-50%, 10px) scale(.8)",
    "transform-origin": "50% 100%",
    opacity: 0,
    padding: "6px 8px",
    "border-radius": "2px",
    transition: "transform .2s ease .1s,opacity .2s ease .1s",
    "pointer-events": "none",
    "font-size": "0.75em"
  },
  "&[data-tooltip-pos=down]::after": {
    top: "100%",
    bottom: "auto",
    "margin-top": "0.5em",
    transform: "translate(-50%, -10px) scale(.8)"
  },
  "&[data-tooltip-pos=down]:last-child::after": {
    right: 0,
    top: "100%",
    bottom: "unset",
    left: "auto",
    "margin-top": "0.5em",
    transform: "translateY(-10px) scale(.8)",
    "transform-origin": "100% 0"
  },
  "&:not([data-tooltip-pos]):last-child::after": {
    right: 0,
    left: "auto",
    transform: "translateY(10px) scale(.8)",
    "transform-origin": "100% 100%"
  }
});
const expandSvg = '<svg viewBox="-113 -113 1250 1250"><path d="M0 232.732444A232.732444 232.732444 0 0 1 232.732444 0h558.535112A232.732444 232.732444 0 0 1 1024 232.732444v558.535112A232.732444 232.732444 0 0 1 791.267556 1024H232.732444A232.732444 232.732444 0 0 1 0 791.267556V232.732444z m232.732444-139.662222a139.662222 139.662222 0 0 0-139.662222 139.662222v558.535112a139.662222 139.662222 0 0 0 139.662222 139.662222h558.535112a139.662222 139.662222 0 0 0 139.662222-139.662222V232.732444a139.662222 139.662222 0 0 0-139.662222-139.662222H232.732444z"></path><path d="M549.575111 245.845333c0-25.799111 20.935111-46.734222 46.734222-46.734222h116.821334A140.202667 140.202667 0 0 1 853.333333 339.313778v116.821333a46.734222 46.734222 0 0 1-93.468444 0v-116.821333c0-25.827556-20.906667-46.734222-46.734222-46.734222h-116.821334a46.734222 46.734222 0 0 1-46.734222-46.734223zM245.845333 549.546667c25.799111 0 46.734222 20.935111 46.734223 46.734222v116.821333c0 25.827556 20.906667 46.734222 46.734222 46.734222h116.821333a46.734222 46.734222 0 0 1 0 93.468445h-116.821333A140.202667 140.202667 0 0 1 199.111111 713.130667v-116.821334c0-25.799111 20.935111-46.734222 46.734222-46.734222z"></path></svg>';
const compressSvg = '<svg viewBox="-113 -113 1250 1250"><path d="M0.739556 233.130667a232.391111 232.391111 0 0 1 232.391111-232.391111h557.738666a232.391111 232.391111 0 0 1 232.391111 232.391111v557.738666a232.391111 232.391111 0 0 1-232.391111 232.391111H233.130667a232.391111 232.391111 0 0 1-232.391111-232.391111V233.130667z m232.391111-139.434667a139.434667 139.434667 0 0 0-139.434667 139.434667v557.738666a139.434667 139.434667 0 0 0 139.434667 139.434667h557.738666a139.434667 139.434667 0 0 0 139.434667-139.434667V233.130667a139.434667 139.434667 0 0 0-139.434667-139.434667H233.130667z"></path><path d="M601.088 186.652444c25.685333 0 46.506667 20.792889 46.506667 46.478223v96.796444c0 25.685333 20.792889 46.478222 46.478222 46.478222h96.796444a46.478222 46.478222 0 1 1 0 92.984889h-96.796444a139.434667 139.434667 0 0 1-139.463111-139.463111V233.130667c0-25.685333 20.821333-46.478222 46.478222-46.478223z m-414.435556 414.435556c0-25.656889 20.792889-46.478222 46.478223-46.478222h96.796444a139.434667 139.434667 0 0 1 139.463111 139.463111v96.796444a46.478222 46.478222 0 0 1-92.984889 0v-96.796444c0-25.685333-20.792889-46.478222-46.478222-46.478222H233.130667a46.478222 46.478222 0 0 1-46.478223-46.506667z"></path></svg>';
const loopSvg = '<svg viewBox="0 0 32 32"><g><path d="m16 2a13.9 13.9 0 0 0 -9 3.32v-2.32a1 1 0 0 0 -2 0v5a1 1 0 0 0 1 1h5a1 1 0 0 0 0-2h-2.89a11.87 11.87 0 0 1 7.89-3 12 12 0 1 1 -11.67 9.23 1 1 0 1 0 -1.94-.46 13.72 13.72 0 0 0 -.39 3.23 14 14 0 1 0 14-14z"/><path d="m14 21.2a2 2 0 0 0 1.06-.31l5.11-3.19a2 2 0 0 0 0-3.4l-5.11-3.19a2 2 0 0 0 -3.06 1.69v6.4a2 2 0 0 0 2 2zm0-8.4 5.11 3.2-5.11 3.2z"/></g></svg>';
const pauseSvg = '<svg viewBox="0 0 1024 1024"><path  d="M327.68 184.32a81.92 81.92 0 0 1 81.92 81.92v491.52a81.92 81.92 0 1 1-163.84 0V266.24a81.92 81.92 0 0 1 81.92-81.92z m368.64 0a81.92 81.92 0 0 1 81.92 81.92v491.52a81.92 81.92 0 1 1-163.84 0V266.24a81.92 81.92 0 0 1 81.92-81.92z" /></svg>';
const pipEnterSvg = '<svg viewBox="0 0 1024 1024"><path d="M768 213.333333H256a85.333333 85.333333 0 0 0-85.333333 85.333334v426.666666a85.333333 85.333333 0 0 0 85.333333 85.333334h170.666667a42.666667 42.666667 0 1 1 0 85.333333H256a170.666667 170.666667 0 0 1-170.666667-170.666667V298.666667a170.666667 170.666667 0 0 1 170.666667-170.666667h512a170.666667 170.666667 0 0 1 170.666667 170.666667v128a42.666667 42.666667 0 1 1-85.333334 0V298.666667a85.333333 85.333333 0 0 0-85.333333-85.333334z m-128 341.333334a128 128 0 0 0-128 128v85.333333a128 128 0 0 0 128 128h170.666667a128 128 0 0 0 128-128v-85.333333a128 128 0 0 0-128-128h-170.666667z"></path></svg>';
const pipExitSvg = '<svg viewBox="0 0 1024 1024"><path d="m768,213.33333l-512,0a85.33333,85.33333 0 0 0 -85.33333,85.33334l0,426.66666a85.33333,85.33333 0 0 0 85.33333,85.33334l170.66667,0a42.66667,42.66667 0 1 1 0,85.33333l-170.66667,0a170.66667,170.66667 0 0 1 -170.66667,-170.66667l0,-426.66666a170.66667,170.66667 0 0 1 170.66667,-170.66667l512,0a170.66667,170.66667 0 0 1 170.66667,170.66667l0,128a42.66667,42.66667 0 1 1 -85.33334,0l0,-128a85.33333,85.33333 0 0 0 -85.33333,-85.33334zm-128,341.33334a128,128 0 0 0 -128,128l0,85.33333a128,128 0 0 0 128,128l170.66667,0a128,128 0 0 0 128,-128l0,-85.33333a128,128 0 0 0 -128,-128l-170.66667,0z"></path><g stroke="null"><g stroke="null" transform="matrix(0.6896517266997474,0,0,0.6896517266997474,-10241.200782450309,-10001.206060939305) "><rect stroke="null" x="15122.523407" y="14826.656681" width="582" height="402" fill="none"></rect></g><g stroke="null" transform="matrix(0.6896517266997474,0,0,0.6896517266997474,-10241.200782450309,-10001.206060939305) "><path stroke="null" d="m15503.523407,14924.856681l-161.8,0c-66.2,0 -120,53.8 -120,120l0,161.8c0,22.1 17.9,40 40,40s40,-17.9 40,-40l0,-144.4l169.8,169.8c7.8,7.8 18,11.7 28.3,11.7c10.2,0 20.5,-3.9 28.3,-11.7c15.6,-15.6 15.6,-40.9 0,-56.6l-170.7,-170.6l146.1,0c22.1,0 40,-17.9 40,-40s-17.9,-40 -40,-40z"></path></g></g></svg>';
const playSvg = '<svg viewBox="0 0 1024 1024"><path  d="M245.76 785.203V238.797c0-50.442 34.918-69.182 77.967-42.046l422.196 266.117c43.11 27.157 43.069 71.128 0 98.284L323.727 827.249c-43.11 27.177-77.967 8.315-77.967-42.046z" /></svg>';
const screenshotSvg = '<svg viewBox="0 0 1024 1024"><path d="M412.245333 757.333333a42.666667 42.666667 0 0 1-56.490666-64l356.48-314.794666a42.666667 42.666667 0 0 1 56.746666 0.256l112.896 101.461333a42.666667 42.666667 0 1 1-57.088 63.488L740.266667 467.626667l-328.021334 289.706666zM810.666667 213.333333h-128a42.666667 42.666667 0 0 1 0-85.333333h170.666666a42.666667 42.666667 0 0 1 42.666667 42.666667v170.666666a42.666667 42.666667 0 0 1-85.333333 0V213.333333zM213.333333 213.333333v128a42.666667 42.666667 0 1 1-85.333333 0V170.666667a42.666667 42.666667 0 0 1 42.666667-42.666667h170.666666a42.666667 42.666667 0 1 1 0 85.333333H213.333333z m597.333334 597.333334v-128a42.666667 42.666667 0 0 1 85.333333 0v170.666666a42.666667 42.666667 0 0 1-42.666667 42.666667h-170.666666a42.666667 42.666667 0 0 1 0-85.333333h128zM213.333333 810.666667h128a42.666667 42.666667 0 0 1 0 85.333333H170.666667a42.666667 42.666667 0 0 1-42.666667-42.666667v-170.666666a42.666667 42.666667 0 0 1 85.333333 0v128z m170.666667-298.666667a128 128 0 1 1 0-256 128 128 0 0 1 0 256z m0-85.333333a42.666667 42.666667 0 1 0 0-85.333334 42.666667 42.666667 0 0 0 0 85.333334z"></path></svg>';
const settingsSvg = '<svg viewBox="0 0 1024 1024" style="scale:1.1"><path d="M0 0h1024v1024H0z" fill-opacity="0"></path><path d="M501.333333 127.573333a21.333333 21.333333 0 0 1 21.333334 0l316.928 182.954667a21.333333 21.333333 0 0 1 10.666666 18.474667v365.994666a21.333333 21.333333 0 0 1-10.666666 18.474667L522.666667 896.426667a21.333333 21.333333 0 0 1-21.333334 0l-316.928-182.954667a21.333333 21.333333 0 0 1-10.666666-18.474667V328.96a21.333333 21.333333 0 0 1 10.666666-18.474667zM512 219.946667L259.029333 365.952v292.053333L512 804.010667l252.928-146.005334V365.952L512 219.946667zM512 426.666667a85.333333 85.333333 0 1 1 0 170.666666 85.333333 85.333333 0 0 1 0-170.666666z"></path></svg>';
const volumeOffSvg = '<svg viewBox="0 0 1024 1024"><path d="M154.88 154.88a42.496 42.496 0 0 0 0 60.16L311.04 371.2 298.666667 384H170.666667c-23.466667 0-42.666667 19.2-42.666667 42.666667v170.666666c0 23.466667 19.2 42.666667 42.666667 42.666667h128l140.373333 140.373333c26.88 26.88 72.96 7.68 72.96-30.293333v-177.92l178.346667 178.346667c-20.906667 15.786667-43.52 29.013333-68.266667 38.826666-15.36 6.4-24.746667 22.613333-24.746667 39.253334 0 30.72 31.146667 50.346667 59.306667 38.826666 34.133333-14.08 66.133333-32.853333 94.72-55.893333l57.173333 57.173333a42.496 42.496 0 1 0 60.16-60.16L215.466667 154.88c-16.64-16.64-43.52-16.64-60.586667 0zM810.666667 512c0 34.986667-6.4 68.693333-17.493334 99.84l65.28 65.28c23.893333-49.92 37.546667-105.813333 37.546667-165.12 0-163.413333-102.4-303.36-246.613333-358.4-25.173333-9.813333-52.053333 9.813333-52.053334 36.693333v8.106667c0 16.213333 10.666667 30.293333 26.026667 36.266667C733.013333 279.04 810.666667 386.56 810.666667 512z m-371.626667-268.373333l-7.253333 7.253333L512 331.093333V273.493333c0-37.973333-46.08-56.746667-72.96-29.866666zM704 512A192 192 0 0 0 597.333333 340.053333v76.373334l105.813334 105.813333c0.426667-3.413333 0.853333-6.826667 0.853333-10.24z"></path></svg>';
const volumeSvg = '<svg viewBox="0 0 1024 1024"><path d="M128 426.666667v170.666666c0 23.466667 19.2 42.666667 42.666667 42.666667h128l140.373333 140.373333c26.88 26.88 72.96 7.68 72.96-30.293333V273.493333c0-37.973333-46.08-57.173333-72.96-30.293333L298.666667 384H170.666667c-23.466667 0-42.666667 19.2-42.666667 42.666667z m576 85.333333A192 192 0 0 0 597.333333 340.053333v343.466667c63.146667-31.146667 106.666667-96 106.666667-171.52zM597.333333 189.866667v8.533333c0 16.213333 10.666667 30.293333 25.6 36.266667C733.013333 278.613333 810.666667 386.56 810.666667 512s-77.653333 233.386667-187.733334 277.333333c-15.36 5.973333-25.6 20.053333-25.6 36.266667v8.533333c0 26.88 26.88 45.653333 51.626667 36.266667C793.6 815.36 896 675.84 896 512s-102.4-303.36-247.04-358.4c-24.746667-9.813333-51.626667 9.386667-51.626667 36.266667z"></path></svg>';
const speedSvg = '<svg viewBox="0 0 1024 1024"><path d="M512 951.04a435.2 435.2 0 1 1 435.2-435.2 435.2 435.2 0 0 1-435.2 435.2z m0-819.2a384 384 0 1 0 384 384A384 384 0 0 0 512 132.096z"></path><path d="M468.992 493.824l-130.048-75.008a20.992 20.992 0 0 0-31.232 18.176v150.016a20.992 20.992 0 0 0 31.232 18.176l130.048-75.008a20.992 20.992 0 0 0 0-36.352zM684.8 493.824l-129.536-75.008a21.248 21.248 0 0 0-31.744 18.432v149.504a21.248 21.248 0 0 0 31.744 18.432l129.536-75.008a20.992 20.992 0 0 0 0-36.352z"></path></svg>';
const subtitleSvg = '<svg viewBox="0 0 1024 1024" version="1.1"><path d="M800 170.666667A138.666667 138.666667 0 0 1 938.666667 309.333333v405.546667a138.666667 138.666667 0 0 1-138.666667 138.666667H224A138.666667 138.666667 0 0 1 85.333333 714.88V309.333333a138.666667 138.666667 0 0 1 130.816-138.453333L224 170.666667h576z m0 64H224l-6.144 0.256A74.666667 74.666667 0 0 0 149.333333 309.333333v405.546667c0 41.216 33.450667 74.666667 74.666667 74.666667h576a74.666667 74.666667 0 0 0 74.666667-74.666667V309.333333a74.666667 74.666667 0 0 0-74.666667-74.666666zM234.666667 512c0-134.229333 115.754667-203.733333 218.538666-145.109333A32 32 0 0 1 421.461333 422.4C361.856 388.437333 298.666667 426.410667 298.666667 512c0 85.546667 63.317333 123.562667 122.88 89.728a32 32 0 0 1 31.573333 55.637333C350.549333 715.733333 234.666667 646.101333 234.666667 512z m320 0c0-134.229333 115.754667-203.733333 218.538666-145.109333a32 32 0 0 1-31.744 55.552C681.856 388.437333 618.666667 426.410667 618.666667 512c0 85.546667 63.317333 123.562667 122.88 89.728a32 32 0 0 1 31.573333 55.637333C670.549333 715.733333 554.666667 646.101333 554.666667 512z"></path></svg>';
const qualitySvg = '<svg viewBox="0 0 32 32"><g><path d="m16 2a14 14 0 1 0 14 14 14 14 0 0 0 -14-14zm0 26a12 12 0 1 1 12-12 12 12 0 0 1 -12 12z"/><path d="m14.5 11a1 1 0 0 0 -1 1v3h-2v-3a1 1 0 0 0 -2 0v8a1 1 0 0 0 2 0v-3h2v3a1 1 0 0 0 2 0v-8a1 1 0 0 0 -1-1z"/><path d="m19.5 11h-2a1 1 0 0 0 -1 1v8a1 1 0 0 0 1 1h2a3 3 0 0 0 3-3v-4a3 3 0 0 0 -3-3zm1 7a1 1 0 0 1 -1 1h-1v-6h1a1 1 0 0 1 1 1z"/></g></svg>';
const langSvg = '<svg viewBox="0 0 1024 1024"><path d="M512 85.333333C277.333333 85.333333 85.333333 277.333333 85.333333 512s192 426.666667 426.666667 426.666667 426.666667-192 426.666667-426.666667S746.666667 85.333333 512 85.333333z m294.4 256H682.666667c-12.8-55.466667-34.133333-102.4-59.733334-153.6 76.8 29.866667 145.066667 81.066667 183.466667 153.6zM512 170.666667c34.133333 51.2 64 106.666667 81.066667 170.666666h-162.133334c17.066667-59.733333 46.933333-119.466667 81.066667-170.666666zM183.466667 597.333333c-8.533333-25.6-12.8-55.466667-12.8-85.333333s4.266667-59.733333 12.8-85.333333h145.066666c-4.266667 29.866667-4.266667 55.466667-4.266666 85.333333s4.266667 55.466667 4.266666 85.333333H183.466667z m34.133333 85.333334H341.333333c12.8 55.466667 34.133333 102.4 59.733334 153.6-76.8-29.866667-145.066667-81.066667-183.466667-153.6zM341.333333 341.333333H217.6c42.666667-72.533333 106.666667-123.733333 183.466667-153.6C375.466667 238.933333 354.133333 285.866667 341.333333 341.333333z m170.666667 512c-34.133333-51.2-64-106.666667-81.066667-170.666666h162.133334c-17.066667 59.733333-46.933333 119.466667-81.066667 170.666666z m98.133333-256H413.866667c-4.266667-29.866667-8.533333-55.466667-8.533334-85.333333s4.266667-55.466667 8.533334-85.333333h200.533333c4.266667 29.866667 8.533333 55.466667 8.533333 85.333333s-8.533333 55.466667-12.8 85.333333z m12.8 238.933334c25.6-46.933333 46.933333-98.133333 59.733334-153.6h123.733333c-38.4 72.533333-106.666667 123.733333-183.466667 153.6z m76.8-238.933334c4.266667-29.866667 4.266667-55.466667 4.266667-85.333333s-4.266667-55.466667-4.266667-85.333333h145.066667c8.533333 25.6 12.8 55.466667 12.8 85.333333s-4.266667 59.733333-12.8 85.333333h-145.066667z"></path></svg>';
const ICONS_MAP = {
  play: playSvg,
  pause: pauseSvg,
  volume: [volumeSvg, volumeOffSvg],
  fullscreen: [expandSvg, compressSvg],
  pip: [pipEnterSvg, pipExitSvg],
  setting: settingsSvg,
  screenshot: screenshotSvg,
  playbackRate: speedSvg,
  subtitle: subtitleSvg,
  loop: loopSvg,
  progressIndicator: null,
  loadingIndicator: null,
  quality: qualitySvg,
  lang: langSvg,
  // plugins
  chromecast: null,
  danmaku: null,
  playlist: null,
  previous: null,
  next: null
};
var Icons;
((Icons2) => {
  Icons2.setupIcons = (icons) => {
    for (const key in icons) {
      if (Object.prototype.hasOwnProperty.call(icons, key)) {
        ICONS_MAP[key] = icons[key];
      }
    }
    return ICONS_MAP;
  };
  Icons2.get = (name) => ICONS_MAP[name];
})(Icons || (Icons = {}));
const focusListener = (player, autoFocus) => {
  function focus(_ref) {
    let target = _ref.target;
    if (target && (player.$root.contains(target) || player.$root == target)) {
      player.$root.classList.add(focused);
    } else {
      player.$root.classList.remove(focused);
    }
  }
  if (autoFocus)
    player.$root.classList.add(focused);
  document.addEventListener("click", focus);
  document.addEventListener("contextmenu", focus);
  player.on("destroy", () => {
    document.removeEventListener("click", focus);
    document.removeEventListener("contextmenu", focus);
  });
};
const isFocused = (player) => player.$root.classList.contains(focused);
const playingListener = (player) => {
  player.on("play", () => {
    player.$root.classList.add(playing);
  });
  player.on(["pause", "videosourcechange"], () => {
    player.$root.classList.remove(playing);
  });
};
const loadingListener = (player) => {
  const addClass2 = () => player.$root.classList.add(loading);
  const removeClass2 = () => {
    if (!player.isSourceChanging) {
      player.$root.classList.remove(loading);
    }
  };
  if (player.$video.preload != "none") {
    addClass2();
  }
  player.on("loadstart", () => {
    if (player.$video.preload == "none")
      removeClass2();
  });
  player.on(["seeking", "videoqualitychange", "videosourcechange"], addClass2);
  player.on(["canplaythrough", "playing", "pause", "seeked", "error"], removeClass2);
  player.on(player.options.autoplay || isSafari ? "loadedmetadata" : "canplay", () => (
    // 无视 isSourceChanging
    // 顺序: loadedmetadata -> ⬇(isSourceChanging: false) -> videosourcechanged(isSourceChanging: true)
    player.$root.classList.remove(loading)
  ));
  player.on(["waiting", "playing"], (_ref2) => {
    let type = _ref2.type;
    if (type == "waiting")
      addClass2();
    const timeWhenWaiting = player.currentTime;
    const timeUpdateListener = () => {
      if (timeWhenWaiting !== player.currentTime) {
        removeClass2();
        player.off("timeupdate", timeUpdateListener);
      } else {
        addClass2();
      }
    };
    player.on("timeupdate", timeUpdateListener);
  });
};
const isLoading = (player) => player.$root.classList.contains(loading);
const fullscreenListener = (player) => {
  player.on("fullscreenchange", (_ref3) => {
    let payload = _ref3.payload;
    if (payload.isWeb) {
      player.$root.classList.toggle(webFullScreen);
    } else {
      player.$root.classList.toggle(fullscreen);
    }
  });
};
const isFullscreen = (player) => player.$root.classList.contains(fullscreen) || player.$root.classList.contains(webFullScreen);
const isWebFullscreen = (player) => player.$root.classList.contains(webFullScreen);
const startListening = (player, config) => {
  playingListener(player);
  loadingListener(player);
  fullscreenListener(player);
  if (!isMobile) {
    focusListener(player, config.autoFocus);
  }
};
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function padZero(time2) {
  return time2 < 10 ? "0" + time2 : "" + time2;
}
function formatTime(duration) {
  if (!isFinite(duration))
    return "--:--";
  const h = Math.floor(duration / 3600);
  const m = Math.floor(duration % 3600 / 60);
  const s = Math.floor(duration % 3600 % 60);
  return (h > 0 ? padZero(h) + ":" : "") + padZero(m) + ":" + padZero(s);
}
function download(url, name) {
  const $a = document.createElement("a");
  $a.href = url;
  $a.download = name;
  $a.click();
}
const resolveVideoAndWatermarkDataURL = (player) => {
  var _a;
  try {
    const $video = player.$video, $root = player.$root;
    const ui = player.context.ui;
    const $canvas = document.createElement("canvas");
    const videoWidth = $video.videoWidth, videoHeight = $video.videoHeight;
    $canvas.width = videoWidth;
    $canvas.height = videoHeight;
    $canvas.getContext("2d").drawImage($video, 0, 0, videoWidth, videoHeight);
    const _ref4 = ((_a = ui.$watermark) == null ? void 0 : _a.style) || {}, top = _ref4.top, left = _ref4.left, right = _ref4.right, bottom = _ref4.bottom;
    if (ui.$watermark && [top, left, right, bottom].filter((it) => it != void 0).length > 1) {
      const _ui$$watermark = ui.$watermark, offsetLeft = _ui$$watermark.offsetLeft, offsetTop = _ui$$watermark.offsetTop, offsetWidth = _ui$$watermark.offsetWidth, offsetHeight = _ui$$watermark.offsetHeight;
      const _ui$$watermark$getBou = ui.$watermark.getBoundingClientRect(), width = _ui$$watermark$getBou.width, height = _ui$$watermark$getBou.height;
      let dx = 0, dy = 0;
      if (left) {
        dx = offsetLeft;
      } else if (right) {
        const offsetRight = $root.clientWidth - offsetLeft - offsetWidth;
        dx = videoWidth - offsetRight - offsetWidth;
      }
      if (top) {
        dy = offsetTop;
      } else if (bottom) {
        const offsetBottom = $root.clientHeight - offsetTop - offsetHeight;
        dy = videoWidth - offsetBottom - offsetHeight;
      }
      $canvas.getContext("2d").drawImage(ui.$watermark, dx, dy, width, height);
    }
    return $canvas.toDataURL("image/png");
  } catch (error2) {
    return error2;
  }
};
const screenShot = (player) => {
  if (isLoading(player) || isNaN(player.duration)) {
    player.emit("notice", {
      text: player.locales.get("Please wait for loading to complete")
    });
    return;
  }
  const resp = resolveVideoAndWatermarkDataURL(player);
  if (resp instanceof Error) {
    player.emit("notice", {
      text: resp.message
    });
  } else {
    const title = player.options.source.title || "OPlayer-ScreenShot";
    download(resp, title + "-" + formatTime(player.currentTime).replace(/:/g, "-") + ".png");
  }
};
const debounce = function(fn) {
  let ms = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1500;
  let time2 = null;
  const clear = () => time2 && clearTimeout(time2);
  const callee = () => {
    clear();
    time2 = setTimeout(() => {
      fn();
    }, ms);
  };
  return {
    callee,
    clear
  };
};
const siblings = (el, cb) => {
  var nodes = [];
  var children = el.parentNode.children;
  for (let i = 0, len = children.length; i < len; i++) {
    if (children[i] !== el) {
      cb == null ? void 0 : cb(children[i]);
      nodes.push(children[i]);
    }
  }
  return nodes;
};
function addClass(target, className) {
  target.classList.add(className);
  return target;
}
function removeClass(target, className) {
  target.classList.remove(className);
  return target;
}
function hasClass(target, className) {
  return target.classList.contains(className);
}
const DRAG_EVENT_MAP = {
  dragStart: isMobile ? "touchstart" : "mousedown",
  dragMove: isMobile ? "touchmove" : "mousemove",
  dragEnd: isMobile ? "touchend" : "mouseup"
};
const VOLUME_SETUP = 10;
const SEEK_SETUP = 5;
const KEY_FN = {
  ArrowUp: (player) => {
    const nextVolume = player.volume * 100 + VOLUME_SETUP;
    player.setVolume(nextVolume / 100);
    player.emit("notice", {
      text: player.locales.get("Volume: %s", ~~(player.volume * 100) + "%")
    });
  },
  ArrowDown: (player) => {
    const nextVolume = player.volume * 100 - VOLUME_SETUP;
    player.setVolume(nextVolume / 100);
    player.emit("notice", {
      text: player.locales.get("Volume: %s", ~~(player.volume * 100) + "%")
    });
  },
  ArrowLeft: (player) => {
    if (player.options.isLive || player.hasError)
      return;
    const tar = player.currentTime - SEEK_SETUP;
    if (tar < 0) {
      player.seek(0);
    } else {
      player.seek(player.currentTime - SEEK_SETUP);
    }
    player.emit("notice", {
      text: formatTime(player.currentTime) + " / " + formatTime(player.duration)
    });
  },
  ArrowRight: (player) => {
    if (player.options.isLive || player.hasError)
      return;
    player.seek(player.currentTime + SEEK_SETUP);
    player.emit("notice", {
      text: formatTime(player.currentTime) + " / " + formatTime(player.duration)
    });
  },
  " ": (player) => player.togglePlay(),
  Escape: (player) => {
    if (player.isFullScreen) {
      player.exitFullscreen();
    } else if (player.$root.classList.contains(webFullScreen)) {
      player.emit("fullscreenchange", {
        isWeb: true
      });
    }
  },
  f: (player) => player.toggleFullScreen(),
  w: (player) => player.emit("fullscreenchange", {
    isWeb: true
  }),
  s: screenShot
};
function registerKeyboard(it) {
  const player = it.player, config = it.config;
  function keydown(e) {
    var _a, _b, _c, _d;
    if (((_a = document.activeElement) == null ? void 0 : _a.tagName) == "INPUT" || ((_b = document.activeElement) == null ? void 0 : _b.getAttribute("contenteditable")) || !((_c = config.keyboard) == null ? void 0 : _c.global) && !((_d = config.keyboard) == null ? void 0 : _d.focused) || config.keyboard.focused && !isFocused(player)) {
      return;
    }
    const key = e.key;
    if (KEY_FN[key]) {
      e.preventDefault();
      KEY_FN[key](player);
    }
  }
  it.keyboard.register = function register(payload) {
    for (const key in payload) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        KEY_FN[key] = payload[key];
      }
    }
  };
  it.keyboard.unregister = function unregister(payload) {
    payload.forEach((k) => {
      delete KEY_FN[k];
    });
  };
  document.addEventListener("keydown", keydown);
  player.on("destroy", () => {
    document.removeEventListener("keydown", keydown);
  });
}
const KEY = "speed";
function registerSpeedSetting(it) {
  const player = it.player, speeds = it.config.speeds, setting2 = it.setting;
  if ((speeds == null ? void 0 : speeds.length) && setting2) {
    setting2.register({
      key: KEY,
      type: "selector",
      name: player.locales.get("Speed"),
      icon: Icons.get("playbackRate"),
      children: speeds.map((speed) => ({
        name: +speed == 1 ? player.locales.get("Normal") : speed + "x",
        value: +speed,
        default: player.playbackRate == +speed
      })),
      onChange: (_ref5) => {
        let value = _ref5.value;
        return player.setPlaybackRate(value);
      }
    });
    player.on("ratechange", () => {
      const rate = player.playbackRate;
      const i = speeds.findIndex((it2) => +it2 == rate);
      if (i == -1) {
        setting2.updateLabel(KEY, rate + "x");
      } else {
        setting2.select(KEY, i, false);
      }
    });
  }
}
const FULL_SLIDE_DURATION = 60;
function registerSlide(it) {
  const player = it.player, config = it.config, $dom = it.$mask;
  if (isMobile && !player.options.isLive && config.slideToSeek && config.slideToSeek != "none") {
    player.once("loadedmetadata", () => {
      let startX = 0;
      let startY = 0;
      let touchedTime = 0;
      let shouldSeekSec = 0;
      let touchedTimer;
      const rect = player.$root.getBoundingClientRect();
      if (config.slideToSeek == "always") {
        $dom.addEventListener("touchstart", (e) => {
          if (hasClass(player.$root, settingShown))
            return;
          const _e$changedTouches$ = e.changedTouches[0], clientX = _e$changedTouches$.clientX, clientY = _e$changedTouches$.clientY;
          startX = clientX;
          startY = clientY;
        });
        $dom.addEventListener("touchmove", moving);
        $dom.addEventListener("touchend", end);
      }
      if (config.slideToSeek == "long-touch") {
        $dom.addEventListener("touchstart", (e) => {
          if (hasClass(player.$root, settingShown))
            return;
          const _e$changedTouches$2 = e.changedTouches[0], clientX = _e$changedTouches$2.clientX, clientY = _e$changedTouches$2.clientY;
          startX = clientX;
          startY = clientY;
          touchedTimer = window.setInterval(() => {
            touchedTime += 100;
            if (touchedTime >= 1e3) {
              clearInterval(touchedTimer);
              player.emit("notice", {
                text: "slid left or right to seek",
                pos: "top"
              });
              $dom.addEventListener("touchmove", moving);
            }
          }, 100);
          $dom.addEventListener("touchend", end, {
            once: true
          });
        });
      }
      function moving(e) {
        if (startX == 0 && startY == 0)
          return;
        const _e$changedTouches$3 = e.changedTouches[0], clientX = _e$changedTouches$3.clientX, clientY = _e$changedTouches$3.clientY;
        const dx = clientX - startX, dy = startY - clientY;
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2)
          return;
        const angle = getSlideAngle(dx, dy);
        if (angle >= -45 && angle < 45 || angle >= 135 && angle <= 180 || angle >= -180 && angle < -135) {
          e.preventDefault();
          shouldSeekSec = FULL_SLIDE_DURATION * dx / rect.width;
          player.emit("notice", {
            text: formatTime(clamp(player.currentTime + shouldSeekSec, 0, player.duration)) + " / " + formatTime(player.duration),
            pos: "top"
          });
        }
      }
      function end() {
        if (startX == 0 && startY == 0)
          return;
        if (config.slideToSeek == "long-touch" && touchedTime < 1e3) {
          if (touchedTimer)
            clearInterval(touchedTimer);
          $dom.removeEventListener("touchmove", moving);
        }
        if (Math.abs(shouldSeekSec) >= 1) {
          player.seek(clamp(player.currentTime + shouldSeekSec, 0, player.duration));
        }
        startX = startY = shouldSeekSec = touchedTime = 0;
      }
    });
  }
}
function getSlideAngle(dx, dy) {
  return Math.atan2(dy, dx) * 180 / Math.PI;
}
function registerFullScreenRotation(player, config) {
  if (config.forceLandscapeOnFullscreen && !isIOS && isMobile) {
    player.on("fullscreenchange", (_ref6) => {
      var _a, _b;
      let payload = _ref6.payload;
      if (payload.isWeb)
        return;
      if (player.isFullScreen) {
        (_a = screen.orientation) == null ? void 0 : _a.lock("landscape");
      } else {
        (_b = screen.orientation) == null ? void 0 : _b.unlock();
      }
    });
  }
}
const time = $.css(_templateObject2 || (_templateObject2 = _taggedTemplateLiteralLoose(["\n  font-variant-numeric: tabular-nums;\n  font-size: 0.875em;\n  margin-top: 2px;\n"])));
const live = $.css("width:0.5em;height:0.5em;background-color:var(--primary-color);border-radius:50%;margin-right:0.5em");
const expand = $.css("\n    position: absolute;\n    top: 10px;\n    right: 50%;\n    border-radius: 2px;\n    box-sizing: border-box;\n    transform: translate(50%, -100%);\n    transition: opacity 0.2s ease, top 0.2s ease;\n    font-size: 0.875em;\n");
const expandBottom = $.css("\n    top: calc(100% - 10px);\n    right: 50%;\n    transform: translateX(50%);\n");
const dropdown = $.css({
  position: "relative",
  display: "flex",
  ["& ." + expand]: {
    visibility: "hidden",
    opacity: 0,
    "background-color": "var(--shadow-background-color)"
  }
});
const dropdownHoverable = $.css({
  ["&:hover"]: {
    "padding-top": "0.5em",
    "margin-top": "-0.5em",
    ["& ." + expand]: {
      visibility: "visible",
      opacity: 1,
      top: 0
    }
  },
  ["&[data-dropdown-pos=top]:hover"]: {
    "padding-bottom": "0.5em",
    "margin-bottom": "-0.5em",
    ["& ." + expand]: {
      top: "100%"
    }
  }
});
const dropItem = $.css({
  padding: "0 0.5em",
  "min-width": "6em",
  display: "block",
  height: "2.4em",
  "line-height": "2.4em",
  cursor: "pointer",
  "text-align": "center",
  "word-break": "keep-all",
  "&:nth-last-child(1)": {
    "margin-bottom": "0px"
  },
  "& *": {
    "pointer-events": "none"
  },
  "&[aria-checked=true]": {
    color: "var(--primary-color)"
  },
  "&:hover": {
    "background-color": "rgba(255, 255, 255, 0.1)"
  }
});
const textIcon = $.cls("textIcon");
const controllers = $.css({
  color: "#fff",
  fill: "#fff",
  height: "2.5em",
  display: "flex",
  "box-sizing": "border-box",
  "justify-content": "space-between",
  "align-items": "center",
  "padding-bottom": isMobile ? 0 : "4px",
  // left & right
  "> div": {
    display: "flex",
    "align-items": "center",
    margin: "0 -.5em",
    ["& > ." + icon + ":last-child" + (isMobile ? ", & >  ." + icon + '[aria-label="Play"], & >  .' + icon + '[aria-label="Pause"]' : "")]: {
      "margin-right": 0
    }
  },
  ["& ." + icon + "." + textIcon]: {
    width: "auto",
    "min-width": "2em",
    "font-size": "0.875em",
    padding: "0 4px",
    "border-radius": "2px"
  },
  ["& ." + icon]: Object.assign({
    width: "2em",
    height: isMobile ? "auto" : "2em",
    "margin-right": "6px",
    "justify-content": "center",
    "align-items": "center",
    display: "inline-flex",
    "border-radius": isMobile ? "50%" : "2px",
    "& > *": {
      height: "1.5em",
      width: "1.5em",
      "pointer-events": "none",
      transition: "transform .2s ease-in-out"
    }
  }, isMobile ? {
    "&:active > *": {
      transform: "scale(.9)"
    }
  } : {
    "&:hover": {
      "background-color": "rgb(255 255 255 / .2)"
    }
  })
});
const activeCls = $.css("display: block;");
const setting = (position) => $.css({
  "z-index": "8",
  "max-height": "75%",
  "border-radius": "2px",
  display: "block",
  position: "absolute",
  right: "1em",
  [position]: position == "top" ? "var(--control-bar-height)" : "2.5em",
  overflow: "auto",
  "background-color": "var(--shadow-background-color)",
  fill: "#fff",
  "&::-webkit-scrollbar": {
    width: "2px"
  },
  "&::-webkit-scrollbar-thumb": {
    background: "var(--primary-color)"
  },
  // panel
  "& > div": {
    display: "none",
    "font-size": "0.875em"
  },
  // active panel
  ["& > div." + activeCls]: {
    display: "block"
  }
});
const panelCls = $.css("min-width: 15.5em;");
const subPanelCls = $.css("min-width: 10.5em;");
const yesIcon = $.css("\n  display: none;\n  width: 1.4em;\n  height: 1.4em;\n");
const nextIcon = $.css("\n  width: 2em;\n  height: 2em;\n  margin: 0 -10px 0 -5px;\n");
const backIcon = $.css("\n  width: 2em;\n  height: 2em;\n  transform: rotate(180deg);\n  margin-left: -10px;\n");
const switcherCls = $.css({
  position: "absolute",
  cursor: "pointer",
  top: "0",
  left: "0",
  right: "0",
  bottom: "0",
  "background-color": "#ccc",
  transition: ".3s",
  "border-radius": "34px",
  "&:before": {
    position: "absolute",
    content: '""',
    height: "16px",
    width: "16px",
    left: "4px",
    bottom: "3px",
    "background-color": "white",
    transition: ".3s",
    "border-radius": "50%"
  }
});
const switcherContainer = $.css("\n  position: relative;\n  width: 40px;\n  height: 22px;\n");
const nextLabelText = $.css("\n  white-space: nowrap;\n  color: rgba(255, 255, 255, 0.7);\n  font-size: 0.8em;\n");
const settingItemCls = $.css({
  height: "2.4em",
  cursor: "pointer",
  color: "#fff",
  "justify-content": "space-between",
  "align-items": "center",
  padding: "0 0.75em",
  "line-height": "1",
  display: "flex",
  overflow: "hidden",
  "& > *": {
    "pointer-events": "none"
  },
  "&:hover": {
    "background-color": "rgba(255, 255, 255, 0.1)"
  },
  ["&[aria-checked='true']"]: {
    ["& ." + yesIcon]: {
      display: "block"
    },
    ["&[data-index]"]: {
      "background-color": "rgba(255, 255, 255, 0.1)"
    },
    ["& ." + switcherCls]: {
      "background-color": "var(--primary-color)",
      "&:before": {
        transform: "translateX(16px)"
      }
    }
  }
});
const settingItemLeft = $.css({
  display: "flex",
  "align-items": "center",
  "margin-right": "10px",
  "& > svg": {
    width: "1.7em",
    height: "1.7em",
    "margin-right": "0.5em"
  }
});
const settingItemRight = $.css("\n  display: flex;\n  align-items: center;\n");
const backRow = $.css({
  width: "100%",
  display: "flex",
  "align-items": "center",
  "border-bottom": "1px solid rgb(255 255 255 / 10%)"
});
const arrowSvg = function() {
  let className = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : nextIcon;
  return "<svg " + (className ? 'class="' + className + '"' : "") + ' viewBox="0 0 32 32"><path d="m 12.59,20.34 4.58,-4.59 -4.58,-4.59 1.41,-1.41 6,6 -6,6 z" fill="#fff"></path></svg>';
};
const selectorOption = function(name) {
  let icon2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
  return '<div class="' + settingItemLeft + '">\n      ' + icon2 + "\n      <span>" + name + "</span>\n    </div>\n    <svg class=" + yesIcon + ' viewBox="0 0 24 24">\n      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="#fff"></path>\n    </svg>\n';
};
const nexter = function(name) {
  let icon2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
  return '<div class="' + settingItemLeft + '">\n      ' + icon2 + "\n      <span>" + name + "</span>\n    </div>\n    <div class=" + settingItemRight + '>\n      <span role="label" class=' + nextLabelText + "></span>\n      " + arrowSvg() + "\n    </div>\n";
};
const back = (name) => '<div class="' + backRow + '">\n      ' + arrowSvg(backIcon) + "\n      <span>" + name + "</span>\n    </div>\n";
const switcher = function(name) {
  let icon2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
  return '<div class="' + settingItemLeft + '">\n    ' + icon2 + "\n    <span>" + name + "</span>\n  </div>\n  <div class=" + settingItemRight + ">\n    <label class=" + switcherContainer + ">\n      <span class=" + switcherCls + "></span>\n    </label>\n  </div>\n";
};
function createRow(_ref7) {
  let type = _ref7.type, key = _ref7.key, name = _ref7.name, icon2 = _ref7.icon, selected = _ref7.default, index = _ref7.index;
  let $item = $.create("div." + settingItemCls, {
    "data-key": key,
    role: Boolean(type) ? "menuitem" : "menuitemradio",
    "aria-haspopup": type == "selector"
  });
  const res = {
    $row: $item,
    $label: void 0
  };
  switch (type) {
    case "switcher":
      $item.innerHTML = switcher(name, icon2);
      $item.setAttribute("aria-checked", selected || false);
      break;
    case "selector":
      $item.innerHTML = nexter(name, icon2);
      res["$label"] = $item.querySelector('span[role="label"]');
      break;
    case "back":
      $item.innerHTML = back(name);
      break;
    default:
      $item.innerHTML = selectorOption(name, icon2);
      $item.setAttribute("aria-checked", selected || false);
      if (typeof index == "number") {
        $item.setAttribute("data-index", index.toString());
      }
      break;
  }
  return res;
}
function createPanel(player, panels, setting2) {
  let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
  if (!setting2 || setting2.length == 0)
    return;
  const parentKey = options.key, target = options.target, parent = options.parent, isSelectorOptionsPanel = options.isSelectorOptionsPanel, name = options.name;
  let panel = {};
  let key = parentKey || "root";
  if (panels[0] && key == "root") {
    panel = panels[0];
    key = panels[0].key;
  } else {
    panel.$ref = $.create("div." + (panels[0] && isSelectorOptionsPanel ? subPanelCls : panelCls), {
      "data-key": key,
      role: "menu"
    });
    panel.key = key;
    panels.push(panel);
  }
  panel.parent = parent;
  const isRoot = panel.key == "root";
  if (!isRoot) {
    const _createRow = createRow({
      name,
      type: "back"
    }), $row = _createRow.$row;
    $row.addEventListener("click", () => {
      var _a;
      panel.$ref.classList.remove(activeCls);
      (_a = panel.parent) == null ? void 0 : _a.$ref.classList.add(activeCls);
    });
    $.render($row, panel.$ref);
  }
  for (let i = 0; i < setting2.length; i++) {
    const _setting2$i = setting2[i], name2 = _setting2$i.name, type = _setting2$i.type, key2 = _setting2$i.key, children = _setting2$i.children, icon2 = _setting2$i.icon, selected = _setting2$i.default, onChange = _setting2$i.onChange;
    const _createRow2 = createRow(Object.assign({
      name: name2,
      type,
      key: key2,
      icon: icon2,
      default: selected
    }, !isRoot && isSelectorOptionsPanel && {
      index: i
    })), $row = _createRow2.$row, $label = _createRow2.$label;
    $.render($row, panel.$ref);
    $.render(panel.$ref, target);
    if (children) {
      const nextIsSelectorOptionsPanel = type == "selector" && children.every((it) => !Boolean(it.type));
      const optionPanel = createPanel(player, panels, children, {
        key: key2,
        target,
        parent: panel,
        isSelectorOptionsPanel: nextIsSelectorOptionsPanel,
        name: type == "selector" ? name2 : void 0
      });
      $row.addEventListener("click", () => {
        panel.$ref.classList.remove(activeCls);
        optionPanel.$ref.classList.add(activeCls);
      });
      if (nextIsSelectorOptionsPanel) {
        const defaultSelected = children.find((it) => it.default);
        if (defaultSelected) {
          $label.innerText = defaultSelected.name;
        }
        optionPanel.select = (i2, shouldBeCallFn) => {
          var _a;
          if (i2 == -1) {
            (_a = optionPanel.$ref.querySelector("[aria-checked=true]")) == null ? void 0 : _a.setAttribute("aria-checked", "false");
            return;
          }
          const $targets = optionPanel.$ref.querySelectorAll("[aria-checked]");
          if ($targets.item(i2).getAttribute("aria-checked") != "true") {
            $targets.forEach((it) => it.setAttribute("aria-checked", "false"));
            $targets.item(i2).setAttribute("aria-checked", "true");
            const value = children[i2];
            $label.innerText = value.name;
            if (shouldBeCallFn)
              onChange == null ? void 0 : onChange(value, {
                index: i2,
                player
              });
          }
        };
        optionPanel.$ref.addEventListener("click", (e) => {
          const target2 = e.target;
          if (target2.hasAttribute("data-index")) {
            optionPanel.select(+target2.getAttribute("data-index"), true);
            panel.$ref.classList.add(activeCls);
            optionPanel.$ref.classList.remove(activeCls);
          }
        });
      }
    } else {
      if (type == "switcher") {
        $row.select = function(shouldBeCallFn) {
          const selected2 = this.getAttribute("aria-checked") == "true";
          this.setAttribute("aria-checked", "" + !selected2);
          if (shouldBeCallFn)
            onChange == null ? void 0 : onChange(!selected2);
        };
        $row.addEventListener("click", () => $row.select(true));
      }
    }
  }
  return panel;
}
function renderSetting(it) {
  const player = it.player, $el = it.$root, config = it.config;
  if (config.settings === false)
    return;
  const topEnabled = config.controlBar && config.topSetting;
  const options = config.settings || [];
  const $dom = $.create("div." + setting(topEnabled ? "top" : "bottom"), {
    "aria-label": "Setting"
  });
  let panels = [];
  let hasRendered = false;
  const defaultSettingMap = {
    loop: {
      name: player.locales.get("Loop"),
      type: "switcher",
      key: "loop",
      icon: Icons.get("loop"),
      default: player.isLoop,
      onChange: (value) => player.setLoop(value)
    }
  };
  bootstrap(options.map((it2) => typeof it2 == "string" ? defaultSettingMap[it2] : it2));
  it.setting.register = function register(payload) {
    bootstrap(Array.isArray(payload) ? payload : [payload]);
  };
  it.setting.unregister = function unregister(key) {
    var _a, _b;
    if (!hasRendered)
      return;
    (_b = (_a = panels[0]) == null ? void 0 : _a.$ref.querySelector("[data-key=" + key + "]")) == null ? void 0 : _b.remove();
    panels = panels.filter((p) => p.key === key ? (p.$ref.remove(), p = null, false) : true);
  };
  it.setting.updateLabel = function updateLabel(key, text) {
    if (!hasRendered)
      return;
    const $item = $dom.querySelector('[data-key="' + key + '"] span[role="label"]');
    if ($item)
      $item.innerText = text;
  };
  it.setting.select = function select(key, value) {
    var _a;
    let shouldBeCallFn = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
    if (!hasRendered)
      return;
    if (typeof value == "number") {
      for (let i = 0; i < panels.length; i++) {
        const panel = panels[i];
        if (panel.key == key) {
          panel.select(value, shouldBeCallFn);
          break;
        }
      }
    } else {
      (_a = $dom.querySelector('[data-key="' + key + '"][aria-checked]')) == null ? void 0 : _a.select(shouldBeCallFn);
    }
  };
  function bootstrap(settings) {
    if (settings.length < 1)
      return;
    if (!hasRendered) {
      hasRendered = true;
      $.render($dom, $el);
      renderSettingMenu();
    }
    createPanel(player, panels, settings, {
      target: $dom
    });
  }
  function renderSettingMenu() {
    const settingButton = $.create("button", {
      class: icon + " " + tooltip,
      "aria-label": player.locales.get("Settings"),
      "data-tooltip-pos": config.topSetting ? "down" : void 0
    }, "" + Icons.get("setting"));
    settingButton.addEventListener("click", (e) => {
      e.stopPropagation();
      player.$root.classList.add(settingShown);
      panels[0].$ref.classList.add(activeCls);
      function outClickListener(e2) {
        if (!$dom.contains(e2.target)) {
          player.$root.classList.remove(settingShown);
          panels.forEach(($p) => $p.$ref.classList.remove(activeCls));
          document.removeEventListener("click", outClickListener);
        }
      }
      setTimeout(() => {
        document.addEventListener("click", outClickListener);
      });
    });
    const index = [config.pictureInPicture && player.isPipEnabled, config.fullscreen].filter(Boolean).length;
    if (topEnabled) {
      const parent = it.$controllerBar.children[1];
      parent.insertBefore(settingButton, parent.children[parent.children.length]);
    } else {
      const parent = it.$controllerBottom.children[1];
      parent.insertBefore(settingButton, parent.children[parent.children.length - index]);
    }
  }
}
const controlBar = $.css({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  "z-index": 7,
  padding: "0.5em 1em 0",
  transition: "transform 0.3s ease",
  height: "var(--control-bar-height)",
  // https://developer.mozilla.org/zh-CN/docs/Web/CSS/env
  //TODO: support display-mode
  // '@media (display-mode: fullscreen)': {
  //   'padding-top': 'constant(safe-area-inset-top)',
  // },
  "&::before": {
    position: "absolute",
    content: "''",
    width: "100%",
    display: "block",
    top: 0,
    left: 0,
    bottom: "-1em",
    "z-index": -1,
    transition: "opacity 0.3s ease",
    "pointer-events": "none",
    "background-image": "linear-gradient(rgba(0, 0, 0, .3), transparent)"
  },
  "& > div:nth-child(1)": {
    overflow: "hidden",
    flex: "1 1 0",
    "margin-right": "0.5em"
  },
  ["& > div:nth-child(2) ." + dropdown + ":last-child ." + expand]: {
    right: "max(50%,3em)"
  },
  ["@global ." + controllerHidden + " &"]: {
    transform: "translateY(calc(-100%))",
    "&::before": {
      opacity: 0
    }
  }
});
const controlBarBackIcon = $.css("width: 2.5em;height: 2.5em;margin:0 -10px;transform: rotate(180deg);");
const controlBarTitle = $.css("flex:1;font-size:1em;margin: 0 0.25em;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;");
const render$a = (it, el) => {
  var _a, _b;
  const player = it.player, config = it.config;
  if (!config.controlBar)
    return;
  const back2 = config.controlBar.back;
  const backEnabled = back2 && isMobile;
  const $dom = it.$controllerBar = $.create("div", {
    class: controlBar + " " + controllers
  }, "<div>\n    " + (backEnabled ? `<span role='button' class="` + controlBarBackIcon + " " + (back2 == "fullscreen" ? hidden$1 : "") + '">' + arrowSvg("") + "</span>" : "") + "\n      <h2 class='" + controlBarTitle + "'>" + (((_b = (_a = player.options) == null ? void 0 : _a.source) == null ? void 0 : _b.title) || "") + "</h2>\n    </div>\n    <div></div>");
  const $controlBarTitle = $dom.querySelector("." + controlBarTitle);
  if (backEnabled) {
    const $controlBarBack = $controlBarTitle.previousElementSibling;
    $controlBarBack.addEventListener("click", (e) => {
      if (player.isFullScreen)
        player.exitFullscreen();
      player.emit("backward", e);
    });
    if (back2 == "fullscreen") {
      player.on("fullscreenchange", () => {
        if (player.isFullScreen) {
          $controlBarBack.classList.remove(hidden$1);
        } else {
          $controlBarBack.classList.add(hidden$1);
        }
      });
    }
  }
  player.on("videosourcechanged", (_ref8) => {
    let payload = _ref8.payload;
    $controlBarTitle.innerText = payload.title || "";
  });
  $.render($dom, el);
};
const renderControllerBar = render$a;
const wrap$1 = $.css(_templateObject3 || (_templateObject3 = _taggedTemplateLiteralLoose(["\n  width: 2.65em;\n  display: flex;\n  height: 7.65em;\n  box-sizing: border-box;\n  flex-direction: column;\n"])));
const volumeValue = $.css("\n  width: 100%;\n  text-align: center;\n  height: 28px;\n  line-height: 28px;\n  margin-bottom: 2px;\n  font-size: 0.75em;\n");
const track = $.css("\n  position: relative;\n  display: flex;\n  justify-content: center;\n  flex: 1;\n  cursor: pointer;\n  padding: 5px 0 14px;\n");
const sliderWrap = $.css("\n  height: 100%;\n  width: 4px;\n  position: relative;\n");
const slider = $.css("\n  width: 4px;\n  height: 100%;\n  overflow: hidden;\n  border-radius: 2px;\n  background: rgba(255, 255, 255, 0.3);\n");
const line$1 = $.css("\n  height: 100%;\n  background-color: var(--primary-color);\n  transform-origin: 0 100%;\n");
const thumb = $.css(_templateObject4 || (_templateObject4 = _taggedTemplateLiteralLoose(["\n  position:absolute;\n  bottom: 0;\n  top: auto;\n  left: -4px;\n  width: 12px;\n  height: 12px;\n  border-radius: 50%;\n  background-color: var(--primary-color);\n  vertical-align: middle;\n  pointer-events: none;\n  "])));
const render$9 = (player, el) => {
  const $dom = $.create("div." + wrap$1, {}, "<div class=" + volumeValue + ">100</div>\n\n    <div class=" + track + ">\n        <div class=" + sliderWrap + ">\n          <div class=" + slider + ">\n            <div class=" + line$1 + "></div>\n          </div>\n\n          <div class=" + thumb + "></div>\n        <div>\n      </div>");
  const $track = $dom.querySelector("." + track);
  const $thumb = $dom.querySelector("." + thumb);
  const $volumeSlider = $dom.querySelector("." + line$1);
  const $volumeValue = $dom.querySelector("." + volumeValue);
  const getSlidingValue = (event) => {
    const rect = $track.getBoundingClientRect();
    const value = (rect.bottom - (event.clientY || event.changedTouches[0].clientY)) / rect.height;
    return value >= 1 ? 1 : value <= 0 ? 0 : value;
  };
  const sync = (e) => {
    e.preventDefault();
    player.setVolume(setter(getSlidingValue(e)));
  };
  const setter = (value) => {
    $volumeValue.innerText = "" + ~~(value * 100);
    $volumeSlider.style.transform = "scaleY(" + value + ")";
    $thumb.style.bottom = "calc(" + ~~(value * 100) + "% - 6px)";
    return value;
  };
  setter(player.volume);
  player.on("volumechange", () => {
    setter(player.isMuted ? 0 : player.volume);
  });
  $track.addEventListener(DRAG_EVENT_MAP.dragStart, (e) => {
    sync(e);
    document.addEventListener(DRAG_EVENT_MAP.dragMove, sync, {
      passive: false
    });
    document.addEventListener(DRAG_EVENT_MAP.dragEnd, () => {
      document.removeEventListener(DRAG_EVENT_MAP.dragMove, sync);
    }, {
      once: true
    });
  });
  $.render($dom, el);
};
const renderVolumeBar = render$9;
const highlightTextCls = $.css("\n  display: none;\n  bottom: 15px;\n  position: absolute;\n  left: 50%;\n  padding: 6px 8px;\n  background-color: var(--shadow-background-color);\n  color: #fff;\n  border-radius: 2px;\n  white-space: nowrap;\n  word-break: nowrap;\n  transform: translateX(-50%);");
const highlightCls = $.css({
  position: "absolute",
  width: "8px",
  height: "4px",
  "background-color": "var(--highlight-color)",
  transform: "translateX(-3px)",
  transition: "all 0.2s",
  ["&:hover > ." + highlightTextCls]: {
    display: "block"
  }
});
function renderHighlight(it, container) {
  const player = it.player, highlightsConfig = it.config.highlight;
  let $highlights = [];
  container.style.setProperty("--highlight-color", (highlightsConfig == null ? void 0 : highlightsConfig.color) || "#FFF");
  function createDto(options) {
    const dto = $.create("div." + highlightCls, {}, '<span class="' + highlightTextCls + '">' + options.text + "</san>");
    dto.style.left = options.left + "%";
    return dto;
  }
  function createHighlights(highlights, duration) {
    $highlights.forEach((it2) => it2.remove());
    for (let i = 0; i < highlights.length; i++) {
      const h = highlights[i];
      const $highlight = createDto({
        left: h.time / duration * 100,
        text: h.text
      });
      $highlights.push($highlight);
      $.render($highlight, container);
    }
  }
  function change(highlights) {
    bootstrap(highlights);
  }
  function bootstrap(highlights) {
    if (player.duration !== Infinity && player.duration > 0) {
      createHighlights(highlights, player.duration);
    } else {
      player.once("loadedmetadata", function durationchange() {
        createHighlights(highlights, player.duration);
      });
    }
  }
  if (highlightsConfig == null ? void 0 : highlightsConfig.source)
    bootstrap(highlightsConfig.source);
  player.on("videosourcechange", () => {
    $highlights.forEach((it2) => it2.remove());
    $highlights = [];
  });
  it.changHighlightSource = change;
}
const thumbnailCls = $.css("\n  position: absolute;\n  left: 0;\n  bottom: 12px;\n  pointer-events: none;\n  transform: translateX(-50%);\n  background-position-y: center;\n  border-radius: 2px;\n  display: none;");
const vttThumbnailsCls = $.css("\n  position: absolute;\n  left: 0;\n  bottom: 12px;\n  pointer-events: none;\n  border-radius: 2px;\n  display: none;");
const defaultThumbnails = {
  width: 160,
  height: 90
};
function renderThumbnail(it, container) {
  const options = it.config.thumbnails, player = it.player;
  let isInitialized = false;
  let thumbnails;
  const $dom = $.render($.create("div." + thumbnailCls), container);
  function init(rate) {
    if (!isInitialized || !rate) {
      isInitialized = true;
      $dom.style.width = thumbnails.width + "px";
      $dom.style.height = thumbnails.height + "px";
      if (!Array.isArray(thumbnails.src))
        $dom.style.backgroundImage = "url(" + thumbnails.src + ")";
    } else {
      const _ref9 = [thumbnails.width / 2, container.clientWidth], halfWidth = _ref9[0], cw = _ref9[1];
      const minRate = halfWidth / cw, maxRate = (cw - halfWidth) / cw;
      $dom.style.left = (rate < minRate ? minRate : rate > maxRate ? maxRate : rate) * 100 + "%";
      if (Array.isArray(thumbnails.src)) {
        const index = thumbnails.number * rate;
        const srcIdx = Math.ceil(index / (thumbnails.x * thumbnails.y)) - 1;
        const gridIdx = index % thumbnails.number;
        const gridY = Math.floor(gridIdx / thumbnails.x);
        const gridX = Math.ceil(gridIdx % thumbnails.x);
        $dom.style.backgroundImage = "url(" + thumbnails.src[srcIdx] + ")";
        $dom.style.backgroundPosition = -gridX + "00% " + -gridY + "00%";
      } else {
        const index = Math.floor(rate * thumbnails.number);
        $dom.style.backgroundPositionX = "-" + index + "00%";
      }
    }
  }
  function change(source) {
    isInitialized = false;
    thumbnails = Object.assign({}, defaultThumbnails, source);
    if (thumbnails.y && !Array.isArray(thumbnails.src)) {
      thumbnails.src = [thumbnails.src];
    }
    it.progressHoverCallback.push(init);
  }
  if (options == null ? void 0 : options.src)
    change(options);
  player.on("videosourcechange", () => {
    isInitialized = false;
    $dom.style.backgroundImage = "none";
    it.progressHoverCallback.splice(it.progressHoverCallback.findIndex((it2) => it2 == init), 1);
  });
  it.changThumbnails = change;
}
const buffered = $.css({
  "background-color": "hsla(0, 0%, 100%, 0.4)"
});
const played = $.css({
  "background-color": "var(--primary-color)"
});
const dot = $.css({
  width: "100%",
  "pointer-events": "none",
  position: "relative",
  "& > *": {
    content: "''",
    display: "block",
    position: "absolute",
    width: "1.4em",
    height: "1.4em",
    top: "calc(-0.7em + 2px)",
    left: "-0.7em",
    bottom: "0",
    transform: isMobile ? "none" : "scale(0)",
    transition: "transform 0.3s ease",
    "z-index": "1"
  },
  "& > *:not(svg)": {
    width: "1em",
    height: "1em",
    top: "calc(-0.5em + 2px)",
    left: "-0.5em",
    "border-radius": "50%",
    "background-color": "#fff"
  }
});
const hit = $.css({
  position: "absolute",
  left: "0",
  "border-radius": "2px",
  padding: "6px 8px",
  "background-color": "var(--shadow-background-color)",
  color: "#fff",
  "z-index": "2",
  "pointer-events": "none",
  transform: "translateX(-50%)",
  display: "none",
  bottom: "15px"
});
const progressDragging = $.css("/* progressDragging */");
const progress = $.css(Object.assign({
  position: "relative",
  "box-sizing": "border-box",
  padding: "6px 0px 4px",
  cursor: "pointer",
  width: "100%",
  "font-size": "0.75em",
  ["&." + progressDragging + " ." + hit + ", &." + progressDragging + " ." + thumbnailCls + ", &." + progressDragging + " ." + vttThumbnailsCls]: {
    display: "block"
  }
}, isMobile ? {
  ["@global ." + controllerHidden + " ." + dot + " > *"]: {
    transform: "scale(0)"
  }
} : {
  ["&." + progressDragging + " ." + dot + " > *, &:hover ." + dot + " > *"]: {
    transform: "scale(1)"
  }
}));
const progressInner = $.css({
  position: "relative",
  height: "4px",
  width: "100%",
  "background-color": "hsla(0, 0%, 100%, 0.2)",
  ["& ." + buffered + ", & ." + played]: {
    position: "absolute",
    left: "0",
    top: "0",
    bottom: "0",
    "pointer-events": "none"
  }
});
const render$8 = (it, el) => {
  var _a;
  const player = it.player, config = it.config;
  if (player.options.isLive)
    return;
  const $dom = it.$progress = $.create("div." + progress, {}, "<div class=" + progressInner + '>\n      <div class="' + hit + '">00:00</div>\n      <div class="' + buffered + '" style="width:0%"></div>\n      <div class="' + played + '" style="width:0%"></div>\n      <div class="' + dot + '" style="transform: translateX(0%);">\n        ' + (Icons.get("progressIndicator") || "<span />") + "\n      </div>\n  </div>");
  const firstElement = $dom.firstElementChild;
  if ((_a = config.thumbnails) == null ? void 0 : _a.isVTT) {
    console.warn("vtt thumbnails support by @oplayer/pluins");
  } else {
    renderThumbnail(it, firstElement);
  }
  it.vttThumbnailsCls = vttThumbnailsCls;
  renderHighlight(it, firstElement);
  const $buffered = $dom.querySelector("." + buffered);
  const $played = $dom.querySelector("." + played);
  const $playedDto = $dom.querySelector("." + dot);
  const $hit = $dom.querySelector("." + hit);
  let isDargMoving = false;
  const getSlidingValue = (event) => {
    const rect = $dom.getBoundingClientRect();
    const value = ((event.clientX || event.changedTouches[0].clientX) - rect.left) / rect.width;
    return value >= 1 ? 1 : value <= 0 ? 0 : value;
  };
  const sync = (e) => {
    const rate = getSlidingValue(e);
    const percentage = rate * 100;
    $played.style.width = percentage + "%";
    $playedDto.style.transform = "translateX(" + percentage + "%)";
    $hit.innerText = formatTime(player.duration * rate);
    $hit.style.left = percentage + "%";
    return rate;
  };
  $dom.addEventListener(DRAG_EVENT_MAP.dragStart, (e) => {
    isDargMoving = true;
    $dom.classList.add(progressDragging);
    const rate = sync(e);
    it.progressHoverCallback.forEach((cb) => cb(rate));
    function moving(e2) {
      e2.preventDefault();
      const rate2 = sync(e2);
      it.progressHoverCallback.forEach((cb) => cb(rate2));
    }
    document.addEventListener(DRAG_EVENT_MAP.dragMove, moving, {
      passive: false
    });
    document.addEventListener(DRAG_EVENT_MAP.dragEnd, (e2) => {
      $dom.classList.remove(progressDragging);
      isDargMoving = false;
      document.removeEventListener(DRAG_EVENT_MAP.dragMove, moving);
      if (!isNaN(player.duration))
        player.seek(getSlidingValue(e2) * player.duration);
    }, {
      once: true
    });
  });
  if (!isMobile) {
    $dom.addEventListener("mouseenter", () => {
      if (isDargMoving)
        return;
      it.progressHoverCallback.forEach((cb) => cb());
    });
    $dom.addEventListener("mousemove", (e) => {
      if (isDargMoving)
        return;
      $dom.classList.add(progressDragging);
      if (e.target.classList.contains(highlightCls)) {
        $hit.style.display = "none";
      } else {
        $hit.removeAttribute("style");
      }
      const rate = getSlidingValue(e);
      $hit.innerText = formatTime(player.duration * rate);
      $hit.style.left = rate * 100 + "%";
      it.progressHoverCallback.forEach((cb) => cb(rate));
    }, {
      passive: false
    });
    $dom.addEventListener("mouseleave", () => {
      if (!isDargMoving)
        $dom.classList.remove(progressDragging);
    });
  }
  player.on(["timeupdate", "seeking"], () => {
    if (isDargMoving)
      return;
    const currentTime = player.currentTime, duration = player.duration;
    const playedWidth = currentTime / duration * 100 || 0;
    $played.style.width = playedWidth + "%";
    $playedDto.style.transform = "translateX(" + playedWidth + "%)";
  });
  player.on("progress", () => {
    const buffered2 = player.buffered.length ? player.buffered.end(player.buffered.length - 1) / player.duration * 100 : 0;
    $buffered.style.width = buffered2 + "%";
  });
  player.on("videosourcechange", () => {
    $buffered.style.width = "0%";
    $played.style.width = "0%";
    $playedDto.style.transform = "translateX(0%)";
  });
  $.render($dom, el);
};
const renderProgress = render$8;
const controllerBottomWrap = $.css({
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  "z-index": 7,
  padding: "0 1em",
  transition: "transform 0.3s ease, padding 0.3s ease",
  "&::before": {
    position: "absolute",
    content: "''",
    width: "100%",
    display: "block",
    bottom: 0,
    left: 0,
    "z-index": -1,
    top: "-1em",
    transition: "opacity 0.3s ease",
    "pointer-events": "none",
    "background-image": "linear-gradient(transparent, rgba(0, 0, 0, .3))"
  },
  //TODO: support display-mode
  // '@media (display-mode: fullscreen)': {
  //   'padding-bottom': 'env(safe-area-inset-bottom)'
  // },
  ["@global ." + controllerHidden + " &"]: {
    padding: 0,
    "pointer-events": "none",
    transform: "translateY(calc(100% - 8px))",
    "&::before": {
      opacity: 0
    }
  }
});
const render$7 = (it, $el) => {
  const player = it.player, config = it.config;
  const el = $.render($.create("div." + controllerBottomWrap), $el);
  if (!config.miniProgressBar) {
    $.css({
      ["@global ." + controllerHidden + " ." + controllerBottomWrap]: {
        transform: "translateY(100%)"
      }
    });
  }
  renderProgress(it, el);
  const _ref10 = [player.locales.get("Play"), player.locales.get("Pause"), player.locales.get("Screenshot"), player.locales.get("Picture in Picture"), player.locales.get(player.isFullscreenEnabled ? "Fullscreen" : "WebFullscreen"), player.locales.get("Previous"), player.locales.get("Next")], playLabel = _ref10[0], pauseLabel = _ref10[1], screenshotLabel = _ref10[2], pipLabel = _ref10[3], fullscreenLabel = _ref10[4], previousLabel = _ref10[5], nextLabel = _ref10[6];
  const previousSvg = Icons.get("previous") || "", nextSvg = Icons.get("next") || "";
  const $dom = it.$controllerBottom = $.create("div." + controllers, {}, "<div>\n\n    " + (previousSvg && '<button class="' + icon + " " + tooltip + '" aria-label="' + previousLabel + '" >' + previousSvg + "</button>") + '\n\n      <button\n        class="' + icon + " " + (player.isPlaying ? on : off) + " " + tooltip + '"\n        aria-label="' + playLabel + '"\n      >\n        ' + Icons.get("play") + "\n        " + Icons.get("pause") + "\n      </button>\n\n      " + (nextSvg && '<button class="' + icon + " " + tooltip + '" aria-label="' + nextLabel + '">' + nextSvg + "</button>") + "\n\n      " + (player.options.isLive ? '<span class="' + live + '"></span>' : "") + "\n\n      <span class=" + time + ">" + (player.options.isLive || player.$video.preload == "none" ? "00:00" : "00:00 / --:--") + '</span>\n    </div>\n\n    <div>\n      <div class="' + dropdown + " " + dropdownHoverable + '">\n        <button class="' + icon + " " + (player.isMuted ? on : off) + '" aria-label="Volume">\n            ' + Icons.get("volume")[0] + "\n            " + Icons.get("volume")[1] + "\n        </button>\n        " + (!isIOS ? "<div class=" + expand + "></div>" : "") + "\n      </div>\n\n      " + (config.screenshot ? '<button class="' + icon + " " + tooltip + '" aria-label="' + screenshotLabel + '">\n              ' + Icons.get("screenshot") + "\n            </button>" : "") + "\n\n      " + (config.pictureInPicture && player.isPipEnabled ? '<button\n              class="' + icon + " " + tooltip + " " + (player.isInPip ? on : off) + '"\n              aria-label="' + pipLabel + '">\n                ' + Icons.get("pip")[0] + "\n                " + Icons.get("pip")[1] + "\n            </button>" : "") + "\n\n      " + (config.fullscreen ? '<button class="' + icon + " " + off + " " + tooltip + '" aria-label="' + fullscreenLabel + '">\n                ' + Icons.get("fullscreen")[0] + "\n                " + Icons.get("fullscreen")[1] + "\n              </button>" : "") + "\n    </div>");
  const $volume = $dom.querySelector("button[aria-label=Volume]");
  if (!isIOS)
    renderVolumeBar(player, $volume.nextElementSibling);
  const $play = $dom.querySelector("button[aria-label=" + playLabel + "]");
  const $time = $dom.querySelector("." + time);
  const $fullscreen = $dom.querySelector('button[aria-label="' + fullscreenLabel + '"]');
  const $pip = $dom.querySelector('button[aria-label="' + pipLabel + '"]');
  const switcher2 = (el2, display) => {
    el2.classList.add(display ? on : off);
    el2.classList.remove(display ? off : on);
  };
  if (config.fullscreen) {
    player.on("fullscreenchange", () => setTimeout(() => {
      switcher2($fullscreen, isFullscreen(player));
    }));
  }
  if (config.pictureInPicture) {
    player.on(["enterpictureinpicture", "leavepictureinpicture"], () => switcher2($pip, player.isInPip));
  }
  player.on(["play", "pause", "videosourcechange"], () => {
    $play.setAttribute("aria-label", player.isPlaying ? pauseLabel : playLabel);
    switcher2($play, player.isPlaying);
  });
  player.on("volumechange", () => switcher2($volume, player.isMuted));
  player.on(["durationchange", "timeupdate", "seeking", "seeked"], () => {
    $time.innerText = formatTime(player.currentTime) + " " + (player.options.isLive ? "" : "/ " + formatTime(player.duration));
  });
  player.on("videosourcechange", () => {
    $time.innerText = player.options.isLive || player.$video.preload == "none" ? "00:00" : "00:00 / --:--";
  });
  $dom.addEventListener("click", (e) => {
    const target = e.target;
    const label = target.getAttribute("aria-label");
    switch (label) {
      case playLabel:
      case pauseLabel:
        return player.togglePlay();
      case "Volume":
        if (isMobile && !isIOS)
          return;
        if (player.isMuted) {
          player.unmute();
        } else {
          player.mute();
        }
        break;
      case pipLabel:
        return player.togglePip();
      case fullscreenLabel:
        if (isWebFullscreen(player) || !player.isFullscreenEnabled) {
          player.emit("fullscreenchange", {
            isWeb: true
          });
        } else {
          player.toggleFullScreen();
        }
        return;
      case screenshotLabel:
        screenShot(player);
        break;
      case nextLabel:
        player.emit("next");
        break;
      case previousLabel:
        player.emit("previous");
        break;
    }
  });
  $.render($dom, el);
};
const renderControllerBottom = render$7;
const CTRL_HIDE_DELAY = 2e3;
const render$6 = (it) => {
  const player = it.player, config = it.config, $root = it.$root;
  const $controller = $.create("div");
  renderControllerBar(it, $controller);
  renderControllerBottom(it, $controller);
  if (config.showControls == "played") {
    addClass($controller, hidden$1);
    player.once("play", () => {
      removeClass($controller, hidden$1);
    });
  }
  const hideCtrl = () => {
    var _a;
    if (!player.isPlaying && !isMobile || hasClass(player.$root, controllerHidden) || hasClass(player.$root, settingShown) || hasClass(player.$root, error) || player.$root.contains(document.activeElement) && ((_a = document.activeElement) == null ? void 0 : _a.tagName) == "INPUT") {
      return;
    }
    addClass(player.$root, controllerHidden);
    player.$root.setAttribute(DATA_CONTROLLER_HIDDEN, "true");
    player.emit("controllervisibilitychange", false);
  };
  const _debounce = debounce(hideCtrl, CTRL_HIDE_DELAY), debounceHideCtrl = _debounce.callee, cancelHideCtrl = _debounce.clear;
  const showCtrl = () => {
    cancelHideCtrl();
    if (hasClass(player.$root, controllerHidden)) {
      removeClass(player.$root, controllerHidden);
      player.$root.setAttribute(DATA_CONTROLLER_HIDDEN, "false");
      player.emit("controllervisibilitychange", true);
    }
  };
  if (config.ctrlHideBehavior != "none") {
    player.on("play", debounceHideCtrl);
    player.on(["pause", "videosourcechange"], showCtrl);
    player.on("destroy", cancelHideCtrl);
  }
  if (!isMobile) {
    player.$root.addEventListener("mousemove", (e) => {
      showCtrl();
      if (!$controller.contains(e.target)) {
        debounceHideCtrl();
      }
    });
    if (config.ctrlHideBehavior == "hover")
      player.$root.addEventListener("mouseleave", hideCtrl);
  }
  it.toggleController = function toggle() {
    if (hasClass($controller, hidden$1)) {
      player.play();
      return;
    }
    if (hasClass(player.$root, controllerHidden)) {
      showCtrl();
    } else {
      hideCtrl();
    }
  };
  $.render($controller, $root);
};
const renderController = render$6;
const hidden = {
  opacity: 0,
  "pointer-events": "none"
};
const styles = $.css(Object.assign({
  transition: "opacity 100ms linear",
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  margin: "auto",
  fill: "#fff",
  width: "3em",
  height: "3em",
  "z-index": "7",
  "& > button": {
    width: "100%",
    height: "100%",
    "border-radius": "100%",
    background: "var(--primary-color)",
    opacity: 0.9,
    padding: "1em",
    transition: "transform .2s ease-in-out",
    "&:active": {
      transform: "scale(.85)"
    },
    "& > *": {
      position: "relative",
      width: "1.5em",
      height: "1.5em",
      left: "-0.2em",
      top: "-0.25em"
    }
  },
  ["@global ." + playing + " &"]: hidden,
  ["@global ." + loading + " &"]: hidden,
  ["@global ." + error + " &"]: hidden
}, isMobile && {
  ["@global ." + controllerHidden + " &"]: hidden
}));
const render$5 = (player, el) => {
  const $dom = $.create("div." + styles, {}, '<button aria-label="Play" class="' + icon + '" type="button">\n      ' + Icons.get("play") + "\n    </button>");
  $.render($dom, el).addEventListener("click", () => player.play());
  return $dom;
};
const renderCoverButton = render$5;
const errorCls = $.css("\n  display: none;\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  color: #fff;\n  background: #000;\n  z-index: 7;\n  align-items: center;\n  padding: 0 10px;\n  word-break: break-all;\n  justify-content: center;\n");
const showCls = $.css("display: flex;");
const VIDEO_ERROR_MAP = {
  1: "MEDIA_ERR_ABORTED",
  2: "MEDIA_ERR_NETWORK",
  3: "MEDIA_ERR_DECODE",
  4: "MEDIA_ERR_SRC_NOT_SUPPORTED"
};
const render$4 = (player, el, config) => {
  if (config.errorBuilder) {
    player.on("error", (_ref11) => {
      let payload = _ref11.payload;
      config.errorBuilder(payload);
    });
    return;
  }
  const $dom = $.render($.create("div." + errorCls, {
    "aria-label": "Error Overlay"
  }), el);
  function show(payload) {
    var _a;
    let message = "";
    if (payload instanceof Event) {
      const error2 = (_a = payload.target) == null ? void 0 : _a.error;
      if (!error2 || !error2.message && typeof error2.code != "number") {
        return;
      }
      message = error2.message || VIDEO_ERROR_MAP[error2.code];
    } else {
      message = payload.message;
    }
    $dom.innerText = message || "UNKNOWN_ERROR";
    player.$root.classList.add(error);
    addClass($dom, showCls);
  }
  function clear() {
    removeClass($dom, showCls);
    player.$root.classList.remove(error);
    $dom.innerText = "";
  }
  player.on(["videosourcechange", "videoqualitychange"], clear);
  player.on("error", (_ref12) => {
    let payload = _ref12.payload;
    return show(payload);
  });
  return show;
};
const renderError = render$4;
const wrap = $.css({
  position: "absolute",
  top: "0",
  bottom: "0",
  left: "0",
  right: "0",
  display: "none",
  "align-items": "center",
  "justify-content": "center",
  ["@global ." + loading + " &"]: {
    display: "flex"
  }
});
const line = $.css({
  position: "relative",
  overflow: "hidden",
  width: "20%",
  height: "4px",
  "border-radius": "4px",
  "&::before,&::after": {
    display: "block",
    content: "''",
    position: "absolute",
    height: "100%",
    width: "100%",
    "background-color": "var(--primary-color)",
    "border-radius": "4px"
  },
  "&::before": {
    opacity: "0.4"
  },
  "&::after": {
    animation: "indeterminate 1.3s infinite linear",
    "transform-origin": "0% 50%"
  },
  "@keyframes indeterminate": {
    "0%": {
      transform: "translateX(0) scaleX(0)"
    },
    "10%": {
      transform: "translateX(0) scaleX(0.2)"
    },
    "40%": {
      transform: "translateX(0) scaleX(0.7)"
    },
    "60%": {
      transform: "translateX(60%) scaleX(0.4)"
    },
    "100%": {
      transform: "translateX(100%) scaleX(0.2)"
    }
  }
});
const render$3 = (_, el) => {
  const $dom = $.create("div." + wrap, {
    "aria-label": "Loading"
  }, "" + (Icons.get("loadingIndicator") || '<div class="' + line + '"></div>'));
  $.render($dom, el);
};
const renderLoading = render$3;
const maskCls = $.css({
  width: "100%",
  height: "100%",
  position: "absolute",
  top: "0",
  left: "0",
  right: "0",
  bottom: "0",
  ["@global ." + settingShown + " &"]: {
    "z-index": "8"
  }
});
const render$2 = (it) => {
  const player = it.player, el = it.$root;
  const $dom = it.$mask = $.create("div." + maskCls);
  let count = 0;
  let timeoutId;
  $dom.addEventListener("click", () => {
    if (hasClass(player.$root, settingShown)) {
      return;
    }
    if (isMobile) {
      it.toggleController();
    } else {
      if (count == 0)
        player.togglePlay();
      if (timeoutId)
        clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        if (count == 2) {
          player.togglePlay();
          player.toggleFullScreen();
        }
        count = 0;
      }, 200);
    }
    count += 1;
  });
  $.render($dom, el);
};
const renderMask = render$2;
const _select = (elm) => {
  const selected = elm.getAttribute("aria-checked") == "true";
  elm.setAttribute("aria-checked", "" + !selected);
  siblings(elm, (it) => it.setAttribute("aria-checked", "" + selected));
};
const renderMenubar = (it) => {
  var _a;
  const initialState = it.config.menu;
  const menus = [];
  const $top = (_a = it.$controllerBar) == null ? void 0 : _a.children[1];
  const $end = it.$controllerBottom.children[1];
  const $targets = [$top, $end].filter(Boolean);
  function clickHandler(e) {
    var _a2, _b;
    const elm = e.target;
    const label = elm.getAttribute("aria-label");
    const target = menus.find((it2) => it2.name == label);
    if (!target || elm.getAttribute("aria-checked") == "true")
      return;
    if (elm.tagName.toUpperCase() == "SPAN") {
      _select(elm);
      (_a2 = target.onChange) == null ? void 0 : _a2.call(target, target.children[+elm.getAttribute("data-index")], elm.parentElement.previousElementSibling, it.player);
    } else if (elm.tagName.toUpperCase() == "BUTTON") {
      (_b = target.onClick) == null ? void 0 : _b.call(target, elm, it.player);
    }
  }
  $targets.forEach((it2) => {
    it2.addEventListener("click", clickHandler);
  });
  it.menu.register = function register(menu) {
    const name = menu.name, icon$1 = menu.icon, children = menu.children, position = menu.position;
    const isTop = position == "top" && $targets.length == 2;
    let $menu = "";
    const $button = '\n    <button\n      aria-label="' + name + '"\n      ' + (isTop ? 'data-tooltip-pos="down"' : "") + '\n      class="' + icon + " " + (!icon$1 ? textIcon : "") + " " + (!menu.children ? tooltip : "") + '"\n      type="button"\n    >' + (icon$1 || name) + "</button>";
    if (menu.children) {
      $menu = '\n      <div class="' + dropdown + " " + dropdownHoverable + '" data-dropdown-pos="' + menu.position + '" aria-label="' + name + '">\n        ' + $button + "\n        <div class='" + expand + " " + (isTop ? expandBottom : "") + "' role='menu'>\n          " + children.map((it2, i) => '<span\n                  role="menuitemradio"\n                  aria-haspopup="false"\n                  aria-label="' + name + '"\n                  class="' + dropItem + '"\n                  aria-checked="' + Boolean(it2.default) + '"\n                  data-index="' + i + '"\n                >' + it2.name + "</span>").join("") + "\n          </div>\n      </div>";
    } else {
      $menu = $button;
    }
    if (isTop) {
      $top.insertAdjacentHTML("afterbegin", $menu);
    } else {
      $end.insertAdjacentHTML("afterbegin", $menu);
    }
    menus.push(menu);
  };
  it.menu.unregister = function unregister(name) {
    $targets.forEach((it2) => {
      var _a2, _b;
      (_a2 = it2.querySelector("button[aria-label=" + name + "]")) == null ? void 0 : _a2.remove();
      (_b = it2.querySelector("div[aria-label=" + name + "]")) == null ? void 0 : _b.remove();
    });
  };
  it.menu.select = function select(name, index) {
    $targets.forEach((it2) => {
      _select(it2.querySelector("." + expand + " > span[aria-label=" + name + "]:nth-child(" + (index + 1) + ")"));
    });
  };
  if (initialState)
    initialState.forEach((menu) => it.menu.register(menu));
};
const noticeCls = $.css({
  position: "absolute",
  display: "none",
  top: "0.625em",
  left: "0.625em",
  right: "0.625em",
  "z-index": 9,
  "margin-top": "var(--control-bar-height)",
  transition: "margin 0.2s",
  ["@global ." + controllerHidden + " &"]: {
    "margin-top": 0
  }
});
const noticeTextCls = $.css("\n  -moz-user-select: all;\n  -webkit-user-select: all;\n  -ms-user-select: all;\n  user-select: all;\n  color: #fff;\n  background-color: var(--shadow-background-color);\n  border-radius: 2px;\n  padding: 5px 10px;\n  font-size: 0.875em;\n");
const topCenter = $.css(_templateObject5 || (_templateObject5 = _taggedTemplateLiteralLoose(["\n  text-align: center;\n"])));
const topRight = $.css(_templateObject6 || (_templateObject6 = _taggedTemplateLiteralLoose(["\n  text-align: right;\n"])));
const leftBottom = $.css(_templateObject7 || (_templateObject7 = _taggedTemplateLiteralLoose(["\n  bottom: 6em;\n  top: initial;\n"])));
const center = $.css(_templateObject8 || (_templateObject8 = _taggedTemplateLiteralLoose(["\n  top: 50%;\n  text-align: center;\n  transform: translateY(-50%);\n"])));
const POS_CLS = {
  center,
  left: "",
  "top-left": "",
  top: topCenter,
  "top-center": topCenter,
  "top-right": topRight,
  right: topRight,
  bottom: leftBottom,
  "left-bottom": leftBottom
};
const NOTICE_HIDE_DELAY = 2e3;
const noticeShowCls = $.css("display:block;");
const render$1 = (it) => {
  const player = it.player, el = it.$root;
  const $dom = $.create("div." + noticeCls, {
    "aria-label": "Notice"
  }, '<span class="' + noticeTextCls + '"></span>');
  const $text = $dom.querySelector("." + noticeTextCls);
  const _debounce2 = debounce(() => removeClass($dom, noticeShowCls), NOTICE_HIDE_DELAY), delayHide = _debounce2.callee;
  function show(text, pos) {
    $text.innerHTML = text;
    $dom.className = noticeCls + " " + noticeShowCls + " " + POS_CLS[pos || "left"];
    delayHide();
  }
  player.on("notice", (_ref13) => {
    let payload = _ref13.payload;
    return show(payload.text, payload.pos);
  });
  it.notice = show;
  $.render($dom, el);
  return show;
};
const renderNotice = render$1;
function fixSrt(srt) {
  return srt.replace(/(\d\d:\d\d:\d\d)[,.](\d+)/g, (_, $1, $2) => {
    let ms = $2.slice(0, 3);
    if ($2.length === 1) {
      ms = $2 + "00";
    }
    if ($2.length === 2) {
      ms = $2 + "0";
    }
    return $1 + "," + ms;
  });
}
function srtToVtt(srtText) {
  return "WEBVTT \r\n\r\n".concat(fixSrt(srtText).replace(/\{\\([ibu])\}/g, "</$1>").replace(/\{\\([ibu])1\}/g, "<$1>").replace(/\{([ibu])\}/g, "<$1>").replace(/\{\/([ibu])\}/g, "</$1>").replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, "$1.$2").replace(/{[\s\S]*?}/g, "").concat("\r\n\r\n"));
}
function vttToBlob(vttText) {
  return URL.createObjectURL(new Blob([vttText], {
    type: "text/vtt"
  }));
}
function assToVtt(ass) {
  const reAss = new RegExp("Dialogue:\\s\\d+,(\\d+:\\d\\d:\\d\\d.\\d\\d),(\\d+:\\d\\d:\\d\\d.\\d\\d),([^,]*),([^,]*),(?:[^,]*,){4}(.*)$", "i");
  return "WEBVTT\r\n\r\n" + ass.split(/\r?\n/).map((line2) => {
    const m = line2.match(reAss);
    if (!m || !m[1] || !m[2] || !m[5])
      return null;
    return {
      start: m[1],
      end: m[2],
      text: escape(m[5].replace(/{[\s\S]*?}/g, "").replace(/\\N/g, "\r\n").replace(/\\n/g, " ").replace(/\\h/g, "&nbsp;"))
    };
  }).filter((line2) => line2 != null).map((line2, i) => i + 1 + "\r\n0" + line2.start + "0 --> 0" + line2.end + "0\r\n" + line2.text).join("\r\n\r\n");
}
function escape(str) {
  return str.replace(/[&<>'"]/g, (tag) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[tag] || tag);
}
const SETTING_KEY = "Subtitle";
function renderSubtitle(it) {
  const player = it.player, el = it.$root, subtitle = it.config.subtitle, setting2 = it.setting;
  return it.subtitle = new Subtitle(player, setting2, el, subtitle);
}
class Subtitle {
  constructor(player, setting2, el, options) {
    this.player = player;
    this.setting = setting2;
    this.el = el;
    this.isShow = false;
    this.update = () => {
      var _a;
      const $dom = this.$dom, player2 = this.player;
      const activeCues = (_a = player2.$video.textTracks[0]) == null ? void 0 : _a.activeCues;
      if (activeCues == null ? void 0 : activeCues.length) {
        let html = "";
        for (let i = 0; i < activeCues.length; i++) {
          const activeCue = activeCues[i];
          if (activeCue) {
            html += activeCue.text.replace(/\\h/g, "&nbsp;").split(/\r?\n/).map((item) => "<p><span>" + item + "</span></p>").join("");
          }
        }
        $dom.innerHTML = html;
      } else {
        $dom.innerHTML = "";
      }
    };
    if (!window.TextDecoder) {
      player.emit("notice", {
        text: player.locales.get("TextDecoder not supported")
      });
      return;
    }
    this.options = Object.assign({
      source: []
    }, options);
    this.processDefault(this.options.source);
    this.createContainer();
    this.fetchSubtitle();
    this.loadSetting();
    this.player.on(["destroy", "videosourcechange"], this.destroy.bind(this));
    this.player.on("videoqualitychang", () => {
      if (this.isShow)
        this.hide();
    });
    this.player.on("videoqualitychanged", this.fetchSubtitle.bind(this));
  }
  changeSource(payload) {
    var _a;
    (_a = this.setting) == null ? void 0 : _a.unregister(SETTING_KEY);
    this.processDefault(payload);
    const next = () => {
      var _a2;
      (_a2 = this.fetchSubtitle()) == null ? void 0 : _a2.then(() => {
        this.player.emit("subtitlesourcechange", payload);
        this.loadSetting();
      });
    };
    if (this.player.isSourceChanging || isNaN(this.player.duration) || this.player.duration < 1) {
      this.player.once("loadedmetadata", next);
    } else {
      next();
    }
  }
  createContainer() {
    const el = this.el, _this$options = this.options, color = _this$options.color, shadow = _this$options.shadow, fontSize = _this$options.fontSize, bottom = _this$options.bottom, fontFamily = _this$options.fontFamily, background = _this$options.background, marginBottom = _this$options.marginBottom;
    this.$dom = $.create("div." + $.css(Object.assign({
      left: "2%",
      right: "2%",
      "text-align": "center",
      "pointer-events": "none",
      position: "absolute",
      "line-height": "1.5",
      "font-family": fontFamily || "inherit",
      color: color || "#fff",
      "text-shadow": shadow || "1px 0 1px #000, 0 1px 1px #000, -1px 0 1px #000, 0 -1px 1px #000, 1px 1px 1px #000, -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000",
      bottom: bottom || "2%",
      "font-size": (fontSize || (isMobile ? 16 : 20)) / 16 + "em",
      "& > p": {
        margin: 0,
        "& span": {
          "white-space": "pre-wrap",
          background: background ? "rgba(8, 8, 8, 0.75)" : "inherit",
          padding: "0 0.25em"
        }
      }
    }, !isMobile && {
      "margin-bottom": marginBottom || "2.2em",
      transition: "margin 0.3s",
      ["@global ." + controllerHidden + " &"]: {
        "margin-bottom": 0
      }
    })), {
      "aria-label": "Subtitle"
    });
    $.render(this.$dom, el);
  }
  createTrack() {
    this.$track = $.render($.create("track", {
      default: true,
      kind: "metadata"
    }), this.player.$video);
    if (!this.player._requestFullscreen) {
      this.$iosTrack = $.render($.create("track", {
        default: false,
        kind: "captions"
      }), this.player.$video);
      this.player.$video.textTracks[1].mode = "hidden";
      this.player.on("fullscreenchange", (_ref14) => {
        let payload = _ref14.payload;
        if (payload.isWeb)
          return;
        if (this.player.isFullScreen) {
          if (this.isShow)
            this.player.$video.textTracks[1].mode = "showing";
        } else {
          this.player.$video.textTracks[1].mode = "hidden";
        }
      });
    }
  }
  changeOffset() {
    var _a, _b;
    const offset = this.currentSubtitle.offset;
    if (offset) {
      const cues = (_a = this.player.$video.textTracks[0]) == null ? void 0 : _a.cues;
      const duration = this.player.duration;
      Array.from(cues || []).forEach((cue) => {
        cue.startTime = clamp(cue.startTime + offset, 0, duration);
        cue.endTime = clamp(cue.endTime + offset, 0, duration);
      });
      if (this.$iosTrack) {
        Array.from(((_b = this.player.$video.textTracks[1]) == null ? void 0 : _b.cues) || []).forEach((cue) => {
          cue.startTime = clamp(cue.startTime + offset, 0, duration);
          cue.endTime = clamp(cue.endTime + offset, 0, duration);
        });
      }
    }
  }
  processDefault(payload) {
    this.options.source = payload;
    this.currentSubtitle = findDefault(payload);
  }
  show() {
    this.isShow = true;
    this.$track.addEventListener("cuechange", this.update);
  }
  hide() {
    const $track = this.$track, $dom = this.$dom;
    this.isShow = false;
    $dom.innerHTML = "";
    $track.removeEventListener("cuechange", this.update);
  }
  fetchSubtitle() {
    if (!this.currentSubtitle)
      return;
    if (!this.$track)
      this.createTrack();
    const currentSubtitle = this.currentSubtitle, player = this.player, $track = this.$track, $iosTrack = this.$iosTrack;
    const src = currentSubtitle.src, encoding = currentSubtitle.encoding, _currentSubtitle$type = currentSubtitle.type, type = _currentSubtitle$type === void 0 ? "auto" : _currentSubtitle$type;
    return fetch(src).then((response) => response.arrayBuffer()).then((buffer) => {
      var _a;
      const decoder = new TextDecoder(encoding);
      const text = decoder.decode(buffer);
      switch (type == "auto" ? (_a = /srt|ass|vtt(#|\?|$)/i.exec(src)) == null ? void 0 : _a[0] : type) {
        case "srt":
          return vttToBlob(srtToVtt(text));
        case "ass":
          return vttToBlob(assToVtt(text));
        case "vtt":
          return vttToBlob(text);
        default:
          return src;
      }
    }).then((url) => {
      if ($track.src)
        URL.revokeObjectURL($track.src);
      if ($iosTrack == null ? void 0 : $iosTrack.src)
        URL.revokeObjectURL($iosTrack.src);
      this.$track.addEventListener("load", () => {
        this.changeOffset();
        this.show();
      }, {
        once: true
      });
      $track.src = url;
      $iosTrack && ($iosTrack.src = url);
    }).catch((err) => {
      player.emit("notice", {
        text: "Subtitle" + err.message
      });
    });
  }
  loadSetting() {
    if (!this.setting)
      return;
    const source = this.options.source;
    if (source.length) {
      this.setting.register({
        name: this.player.locales.get("Subtitle"),
        type: "selector",
        icon: Icons.get("subtitle"),
        key: SETTING_KEY,
        onChange: (_ref15) => {
          var _a;
          let value = _ref15.value;
          if (value) {
            if (value.src == ((_a = this.currentSubtitle) == null ? void 0 : _a.src)) {
              this.show();
            } else {
              this.currentSubtitle = value;
              this.$dom.innerHTML = "";
              this.fetchSubtitle();
            }
          } else {
            this.hide();
          }
        },
        children: [{
          name: this.player.locales.get("OFF"),
          default: !this.currentSubtitle
        }].concat(source == null ? void 0 : source.map((s) => {
          var _a;
          return {
            name: s.name,
            default: ((_a = this.currentSubtitle) == null ? void 0 : _a.src) == s.src,
            value: s
          };
        }))
      });
    }
  }
  destroy() {
    var _a;
    const $dom = this.$dom, $track = this.$track, $iosTrack = this.$iosTrack;
    $track == null ? void 0 : $track.removeEventListener("cuechange", this.update);
    (_a = this.setting) == null ? void 0 : _a.unregister(SETTING_KEY);
    if ($track == null ? void 0 : $track.src)
      URL.revokeObjectURL($track.src);
    if ($iosTrack == null ? void 0 : $iosTrack.src)
      URL.revokeObjectURL($iosTrack.src);
    $track == null ? void 0 : $track.remove();
    $iosTrack == null ? void 0 : $iosTrack.remove();
    $dom.innerHTML = "";
    this.isShow = false;
    this.$track = this.$iosTrack = void 0;
  }
}
function findDefault(o) {
  return o.find((st) => st.default);
}
const render = (it, config) => {
  var _a;
  const watermark = (_a = config.theme) == null ? void 0 : _a.watermark;
  if (!watermark)
    return;
  const wm = it.$watermark = document.createElement("img");
  wm.setAttribute("alt", "watermark");
  for (const key in watermark.style) {
    wm.style[key] = watermark.style[key];
  }
  for (const key in watermark.attrs) {
    wm.setAttribute(key, watermark.attrs[key]);
  }
  wm.src = watermark.src;
  it.$root.appendChild(wm);
};
const defaultConfig = {
  fullscreen: true,
  coverButton: true,
  miniProgressBar: true,
  autoFocus: true,
  forceLandscapeOnFullscreen: true,
  showControls: "always",
  keyboard: {
    focused: true
  },
  settings: ["loop"],
  theme: {
    primaryColor: "#6668ab"
  },
  speeds: ["2.0", "1.5", "1.25", "1.0", "0.75", "0.5"],
  ctrlHideBehavior: "hover"
};
class UI {
  constructor(config) {
    this.config = config;
    this.key = "ui";
    this.version = "1.2.34";
    this.name = "oplayer-theme-ui";
    this.keyboard = {};
    this.setting = {};
    this.menu = {};
    this.progressHoverCallback = [];
    this.config = mergeDeep({}, defaultConfig, config);
  }
  apply(player) {
    var _a, _b;
    const config = this.config;
    this.player = player;
    const $root = this.$root = $.create("div." + root(config));
    render(this, config);
    if (player.isNativeUI) {
      loadingListener(player);
      renderCoverButton(player, $root);
      renderLoading(player, $root);
      $.render($root, player.$root);
      return;
    }
    this.icons = Icons.setupIcons(config.icons);
    startListening(player, config);
    renderError(player, $root, config);
    renderNotice(this);
    renderLoading(player, $root);
    if (config.coverButton)
      this.$coverButton = renderCoverButton(player, $root);
    renderController(this);
    renderMask(this);
    renderSetting(this);
    renderMenubar(this);
    renderSubtitle(this);
    registerSpeedSetting(this);
    registerSlide(this);
    registerFullScreenRotation(player, config);
    if (!isMobile && (((_a = config.keyboard) == null ? void 0 : _a.focused) || ((_b = config.keyboard) == null ? void 0 : _b.global))) {
      registerKeyboard(this);
    }
    $.render($root, player.$root);
    return this;
  }
  destroy() {
  }
  /**
   * @deprecated use changHighlightSource
   */
  highlight(highlights) {
    return this.changHighlightSource(highlights);
  }
}
function create(config) {
  return new UI(config);
}
export {
  create as default
};
