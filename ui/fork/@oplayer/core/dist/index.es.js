/**
 * name: @oplayer/core
 * version: v1.2.31
 * description: Oh! Another HTML5 video player.
 * author: shiyiya
 * homepage: https://github.com/shiyiya/oplayer
 */
var _a, _b, _c, _d, _e, _f, _g, _h, _i;
function hashify(str) {
  return hash(str).toString(36);
}
function hash(str) {
  let seed = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
  let m = 1540483477;
  let r = 24;
  let h = seed ^ str.length;
  let length = str.length;
  let currentIndex = 0;
  while (length >= 4) {
    let k = UInt32(str, currentIndex);
    k = Umul32(k, m);
    k ^= k >>> r;
    k = Umul32(k, m);
    h = Umul32(h, m);
    h ^= k;
    currentIndex += 4;
    length -= 4;
  }
  switch (length) {
    case 3:
      h ^= UInt16(str, currentIndex);
      h ^= str.charCodeAt(currentIndex + 2) << 16;
      h = Umul32(h, m);
      break;
    case 2:
      h ^= UInt16(str, currentIndex);
      h = Umul32(h, m);
      break;
    case 1:
      h ^= str.charCodeAt(currentIndex);
      h = Umul32(h, m);
      break;
  }
  h ^= h >>> 13;
  h = Umul32(h, m);
  h ^= h >>> 15;
  return h >>> 0;
}
function UInt32(str, pos) {
  return str.charCodeAt(pos++) + (str.charCodeAt(pos++) << 8) + (str.charCodeAt(pos++) << 16) + (str.charCodeAt(pos) << 24);
}
function UInt16(str, pos) {
  return str.charCodeAt(pos++) + (str.charCodeAt(pos++) << 8);
}
function Umul32(n, m) {
  n = n | 0;
  m = m | 0;
  let nlo = n & 65535;
  let nhi = n >>> 16;
  let res = nlo * m + ((nhi * m & 65535) << 16) | 0;
  return res;
}
function isObject(item) {
  return Boolean(item && typeof item === "object" && !Array.isArray(item));
}
function mergeDeep(target) {
  for (var _len = arguments.length, sources = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    sources[_key - 1] = arguments[_key];
  }
  if (!sources.length)
    return target;
  const source = sources.shift();
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key])
          Object.assign(target, {
            [key]: {}
          });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, {
          [key]: source[key]
        });
      }
    }
  }
  return mergeDeep.apply(void 0, [target].concat(sources));
}
function isPlainObject(obj) {
  if (typeof obj !== "object" || obj === null)
    return false;
  let proto = obj;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(obj) === proto;
}
function isSelector(key) {
  let possibles = [":", ".", "[", ">", " "], found = false, ch = key.charAt(0);
  for (let i = 0; i < possibles.length; i++) {
    if (ch === possibles[i]) {
      found = true;
      break;
    }
  }
  return found || key.indexOf("&") >= 0;
}
var selectorTokenizer = /[(),]|"(?:\\.|[^"\n])*"|'(?:\\.|[^'\n])*'|\/\*[\s\S]*?\*\//g;
function splitSelector(selector) {
  if (selector.indexOf(",") === -1) {
    return [selector];
  }
  var indices = [], res = [], inParen = 0, o;
  while (o = selectorTokenizer.exec(selector)) {
    switch (o[0]) {
      case "(":
        inParen++;
        break;
      case ")":
        inParen--;
        break;
      case ",":
        if (inParen)
          break;
        indices.push(o.index);
    }
  }
  for (o = indices.length; o--; ) {
    res.unshift(selector.slice(indices[o] + 1));
    selector = selector.slice(0, indices[o]);
  }
  res.unshift(selector);
  return res;
}
function joinSelectors(a, b) {
  let as = splitSelector(a);
  let bs = splitSelector(b).map((b2) => !(b2.indexOf("&") >= 0) ? "&" + b2 : b2);
  return bs.reduce((arr, b2) => arr.concat(as.map((a2) => b2.replace(/\&/g, a2))), []).join(",");
}
function joinMediaQueries(a, b) {
  return a ? "@media " + a.substring(6) + " and " + b.substring(6) : b;
}
function isMediaQuery(key) {
  return key.indexOf("@media") === 0;
}
function isKeyframes(key) {
  return key.indexOf("@keyframes") === 0;
}
function isGlobal(key) {
  return key.indexOf("@global") === 0;
}
function build(selector, _ref) {
  var _a2;
  let rules = _ref.rules, mediaQuery = _ref.mediaQuery, globalSelector = _ref.globalSelector;
  let css2 = {};
  if (globalSelector)
    selector = globalSelector;
  (_a2 = Object.keys(rules)) == null ? void 0 : _a2.forEach((key) => {
    if (isGlobal(key)) {
      const rawKey = key;
      key = key.substring(8);
      const selfKey = key.indexOf("&");
      let _selector;
      if (selfKey != -1) {
        _selector = joinSelectors(selector, key);
        globalSelector = key.substring(0, selfKey - 1).trim();
      } else {
        _selector = key;
      }
      mergeDeep(css2, build(_selector, {
        mediaQuery,
        rules: rules[rawKey],
        globalSelector: _selector
      }));
    } else if (isSelector(key)) {
      mergeDeep(css2, build(joinSelectors(selector, key), {
        rules: rules[key],
        mediaQuery
      }));
    } else if (isMediaQuery(key)) {
      mergeDeep(css2, build(selector, {
        mediaQuery: joinMediaQueries(mediaQuery, key),
        rules: rules[key]
      }));
    } else {
      if (mediaQuery) {
        var _css2$mediaQuery, _css2$mediaQuery2, _selector2, _css2$mediaQuery2$_se;
        (_css2$mediaQuery = css2[mediaQuery]) !== null && _css2$mediaQuery !== void 0 ? _css2$mediaQuery : css2[mediaQuery] = {};
        (_css2$mediaQuery2$_se = (_css2$mediaQuery2 = css2[mediaQuery])[_selector2 = selector]) !== null && _css2$mediaQuery2$_se !== void 0 ? _css2$mediaQuery2$_se : _css2$mediaQuery2[_selector2] = {};
        css2[mediaQuery][selector][key] = rules[key];
      } else {
        if (isKeyframes(key)) {
          css2[key] = rules[key];
        } else {
          var _selector3, _css2$_selector;
          (_css2$_selector = css2[_selector3 = selector]) !== null && _css2$_selector !== void 0 ? _css2$_selector : css2[_selector3] = {};
          css2[selector][key] = rules[key];
        }
      }
    }
  });
  return css2;
}
function deepStyleString(style) {
  let v = [];
  for (const key in style) {
    if (Object.hasOwnProperty.call(style, key)) {
      const element = style[key];
      if (isObject(element)) {
        v.push(key + "{" + deepStyleString(element) + "}");
      } else {
        v.push(key + ":" + element);
      }
    }
  }
  return /^\d%/.test(v[0]) ? v.join(" ") : v.join(";");
}
function styleString(style) {
  let str = [];
  for (const key in style) {
    if (Object.hasOwnProperty.call(style, key)) {
      const element = style[key];
      if (isMediaQuery(key)) {
        str.push(key + "{" + styleString(element) + "}");
      } else if (isKeyframes(key)) {
        str.push(key + "{" + deepStyleString(element) + "}");
      } else {
        const v = Object.entries(element).map((_ref2) => {
          let k = _ref2[0], v2 = _ref2[1];
          return k + ":" + v2;
        }).join(";");
        str.push(key + "{" + v + "}");
      }
    }
  }
  return str;
}
function css(css2, selector) {
  return styleString(build(selector, {
    rules: css2
  }));
}
var $;
(($2) => {
  $2.create = function(t) {
    let attrs = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    let tpl = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "";
    const isIdSelector = t.indexOf("#") !== -1;
    const isClassSelector = t.indexOf(".") !== -1;
    const _ref3 = isIdSelector ? t.split("#") : isClassSelector ? t.split(".") : [t], tag = _ref3[0], selector = _ref3[1];
    const dom = document.createElement(tag);
    if (isIdSelector)
      dom.id = selector;
    if (isClassSelector)
      dom.classList.add(selector);
    tpl && (dom.innerHTML = tpl);
    Object.keys(attrs).forEach((key) => {
      const attr = attrs[key];
      if ((tag === "video" || tag === "audio") && typeof attr === "boolean") {
        attr && dom.setAttribute(key, "");
      } else {
        if (typeof attr !== "undefined") {
          dom.setAttribute(key, "" + attr);
        }
      }
    });
    return dom;
  };
  $2.render = (elm, container) => {
    return container.appendChild(elm);
  };
  $2.isBrowser = () => Boolean(typeof globalThis !== "undefined" && globalThis.document && globalThis.document.documentElement);
  function createSheet(key) {
    if (!(0, $2.isBrowser)())
      return null;
    let tag = document.createElement("style");
    tag.setAttribute("data-" + key, "");
    tag.appendChild(document.createTextNode(""));
    (document.head || document.getElementsByTagName("head")[0]).appendChild(tag);
    for (let i = 0; i < document.styleSheets.length; i++) {
      if (document.styleSheets[i].ownerNode === tag) {
        return document.styleSheets.item(i);
      }
    }
    return null;
  }
  $2.createSheet = createSheet;
  const createSelector = (() => {
    const cachedCss = /* @__PURE__ */ Object.create({});
    return (s) => {
      const key = typeof s == "object" ? JSON.stringify(s) : s;
      if (!cachedCss[key]) {
        cachedCss[key] = "css-" + hashify(key);
      }
      return cachedCss[key];
    };
  })();
  $2.createCss = (_ref4) => {
    let sheet = _ref4.sheet, ssrData = _ref4.ssrData;
    return function() {
      var _a2;
      for (var _len2 = arguments.length, arg = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        arg[_key2] = arguments[_key2];
      }
      const isRaw = Boolean(arg[0] && arg[0].length && arg[0].raw);
      let stringify = "";
      if (isRaw) {
        let strings = arg[0];
        stringify += strings[0];
        for (let i = 1; i < arg.length; i++) {
          stringify += typeof arg[i] !== "string" ? "" : arg[i];
          stringify += strings[i];
        }
      } else if (typeof arg[0] == "string") {
        stringify = arg[0];
      } else {
        stringify = JSON.stringify(arg[0]);
      }
      const cls2 = createSelector(stringify);
      if (sheet) {
        for (let i = 0; i < sheet.cssRules.length; i++) {
          if (((_a2 = sheet.cssRules[i]) == null ? void 0 : _a2.selectorText) == "." + cls2) {
            return cls2;
          }
        }
      }
      let styles = ["." + cls2 + "{" + stringify + "}"];
      if (!isRaw && typeof arg[0] == "object") {
        styles = css(arg[0], "." + cls2);
      }
      if (sheet) {
        styles.forEach((rule) => {
          sheet.insertRule(rule, sheet.cssRules.length);
        });
      } else {
        ssrData = ssrData.concat(styles);
      }
      return cls2;
    };
  };
  $2.createStyled = () => {
    const ssrData = [];
    const sheet = createSheet("oplayer");
    return {
      css: (0, $2.createCss)({
        sheet,
        ssrData
      }),
      getCssValue: () => ssrData
    };
  };
  var _ref5 = (0, $2.createStyled)();
  $2.css = _ref5.css;
  $2.getCssValue = _ref5.getCssValue;
  $2.cls = (str) => "css-" + hashify(str);
})($ || ($ = {}));
const $$1 = $;
const isiPad = /(iPad)/gi.test((_a = globalThis.navigator) == null ? void 0 : _a.userAgent) || // chrome
/Macintosh/i.test((_b = globalThis.navigator) == null ? void 0 : _b.userAgent) && // safari  - iPad on iOS 13 detection
Boolean((_c = globalThis.navigator) == null ? void 0 : _c.maxTouchPoints) && ((_d = globalThis.navigator) == null ? void 0 : _d.maxTouchPoints) >= 1;
const isiPhone = /iPhone/gi.test((_e = globalThis.navigator) == null ? void 0 : _e.userAgent);
const isSafari = /^((?!chrome|android).)*safari/i.test((_f = globalThis.navigator) == null ? void 0 : _f.userAgent);
const isIOS = isiPhone || isiPad;
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test((_g = globalThis.navigator) == null ? void 0 : _g.userAgent) || isIOS;
const isQQBrowser = /mqqbrowser/i.test((_h = globalThis.navigator) == null ? void 0 : _h.userAgent) && !/ qq/i.test((_i = globalThis.navigator) == null ? void 0 : _i.userAgent);
const loadScript = (src, onLoad, onError) => {
  var _a2;
  const script = document.createElement("script");
  script.src = src;
  script.onload = onLoad;
  script.onerror = onError;
  const firstScriptTag = document.getElementsByTagName("script")[0];
  (_a2 = firstScriptTag == null ? void 0 : firstScriptTag.parentNode) == null ? void 0 : _a2.insertBefore(script, firstScriptTag);
};
const pendingSDKRequests = {};
const isUndefined = (value) => typeof value === "undefined";
const loadSDK = function(url, sdkGlobalVar, sdkReadyVar) {
  let isLoaded = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : () => true;
  let loadScriptFn = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : loadScript;
  const getGlobal = (key) => {
    if (!isUndefined(window[key]))
      return window[key];
    if (window.exports && window.exports[key])
      return window.exports[key];
    if (window.module && window.module.exports && window.module.exports[key]) {
      return window.module.exports[key];
    }
    return void 0;
  };
  const existingGlobal = getGlobal(sdkGlobalVar);
  if (existingGlobal && isLoaded(existingGlobal)) {
    return Promise.resolve(existingGlobal);
  }
  return new Promise((resolve, reject) => {
    if (!isUndefined(pendingSDKRequests[url])) {
      pendingSDKRequests[url].push({
        resolve,
        reject
      });
      return;
    }
    pendingSDKRequests[url] = [{
      resolve,
      reject
    }];
    const onLoaded = (sdk) => {
      var _a2;
      (_a2 = pendingSDKRequests[url]) == null ? void 0 : _a2.forEach((request) => request.resolve(sdk));
    };
    if (!isUndefined(sdkReadyVar)) {
      const previousOnReady = window[sdkReadyVar];
      window[sdkReadyVar] = function() {
        if (!isUndefined(previousOnReady))
          previousOnReady.apply(void 0, arguments);
        onLoaded(getGlobal(sdkGlobalVar));
      };
    }
    loadScriptFn(url, () => {
      if (isUndefined(sdkReadyVar))
        onLoaded(getGlobal(sdkGlobalVar));
    }, (e) => {
      var _a2;
      (_a2 = pendingSDKRequests[url]) == null ? void 0 : _a2.forEach((request) => {
        request.reject(e);
      });
      delete pendingSDKRequests[url];
    });
  });
};
const VIDEO_EVENTS = ["abort", "canplay", "canplaythrough", "durationchange", "emptied", "ended", "error", "loadeddata", "loadedmetadata", "loadstart", "pause", "play", "playing", "progress", "ratechange", "seeked", "seeking", "stalled", "suspend", "timeupdate", "volumechange", "waiting", "encrypted", "waitingforkey", "enterpictureinpicture", "leavepictureinpicture"];
const PLAYER_EVENTS = ["contextmenu"];
const OH_EVENTS = [
  "loadedplugin",
  "videoqualitychange",
  "videosourcechange",
  // 'posterchange',
  "destroy"
];
const EVENTS = [].concat(VIDEO_EVENTS, PLAYER_EVENTS, OH_EVENTS);
class EventEmitter {
  constructor() {
    this.events = /* @__PURE__ */ Object.create(null);
  }
  on(name, callback) {
    if (!this.events[name]) {
      this.events[name] = [];
    }
    this.events[name].push(callback);
  }
  onAny(names, callback) {
    names.forEach((name) => this.on(name, callback));
  }
  once(name, callback) {
    const once = (event) => {
      callback({
        type: name,
        payload: event.payload
      });
    };
    once.raw = callback;
    this.on(name, once);
  }
  off(name, callback) {
    if (!this.events[name])
      return;
    for (let i = 0; i < this.events[name].length; i++) {
      const queue = this.events[name][i];
      if (queue == callback || callback == queue.raw) {
        this.events[name].splice(i, 1);
      }
    }
  }
  offAny(name) {
    this.events[name] = [];
  }
  offAll() {
    this.events = /* @__PURE__ */ Object.create(null);
  }
  emit(name, payload) {
    var _a2, _b2;
    const onceOffQueue = [];
    (_a2 = this.events[name]) == null ? void 0 : _a2.forEach((callback) => {
      callback({
        type: name,
        payload
      });
      if (callback.raw)
        onceOffQueue.push(callback);
    });
    (_b2 = this.events["*"]) == null ? void 0 : _b2.forEach((callback) => {
      callback({
        type: name,
        payload
      });
      if (callback.raw)
        onceOffQueue.push(callback);
    });
    onceOffQueue.forEach((it) => {
      this.off(name, it);
    });
  }
}
const Play = "播放";
const Pause = "暂停";
const Loop = "循环播放";
const Volume = "音量";
const Mute = "静音";
const Speed = "播放速度";
const LIVE = "直播";
const Language = "语言";
const Screenshot = "截图";
const Subtitle = "字幕";
const Quality = "画质";
const Fullscreen = "全屏";
const Settings = "设置";
const Danmaku = "弹幕";
const Display = "显示";
const Opacity = "透明度";
const FontSize = "字体大小";
const Off = "关闭";
const Auto = "自动";
const Default = "默认";
const Normal = "正常";
const Close = "关闭";
const CN = {
  Play,
  Pause,
  Loop,
  Volume,
  "Volume: %s": "音量：%s",
  Mute,
  Speed,
  LIVE,
  Language,
  Screenshot,
  Subtitle,
  Quality,
  Fullscreen,
  "TextDecoder Not Supported": "不支持原生字幕",
  Settings,
  "Picture in Picture": "画中画",
  Danmaku,
  Display,
  Opacity,
  FontSize,
  "Display Area": "显示区域",
  Off,
  Auto,
  Default,
  Normal,
  "%ss": "%s秒",
  Close,
  "Can be closed after %ss": "%s秒后可关闭广告"
};
class I18n {
  constructor(defaultLang) {
    this.languages = {
      zh: CN,
      "zh-CN": CN,
      en: Object.keys(CN).reduce((previous, current) => (previous[current] = current, previous), {})
    };
    this.lang = defaultLang === "auto" ? navigator.language : defaultLang;
    if (!this.languages[this.lang]) {
      navigator.languages.some((lang) => {
        if (this.languages[lang]) {
          this.lang = lang;
          return true;
        }
        if (lang.indexOf("-") !== -1) {
          const short = lang.split("-")[0];
          if (short && this.languages[short]) {
            this.lang = short;
            return true;
          }
        }
        return false;
      });
    }
    if (!this.languages[this.lang])
      this.lang = "zh-CN";
  }
  get(key) {
    for (var _len3 = arguments.length, arg = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      arg[_key3 - 1] = arguments[_key3];
    }
    const result = this.languages[this.lang][key];
    if (result == void 0)
      return key;
    let i = 0;
    return result.replace(/%s/gi, () => {
      var _arg$i;
      return (_arg$i = arg[i++]) !== null && _arg$i !== void 0 ? _arg$i : "";
    });
  }
  update(languages) {
    mergeDeep(this.languages, languages);
  }
}
const defaultOptions = {
  autoplay: false,
  muted: false,
  loop: false,
  volume: 1,
  preload: "metadata",
  playbackRate: 1,
  playsinline: true,
  lang: "auto",
  source: {},
  videoAttr: {},
  isLive: false,
  autopause: true,
  isNativeUI: () => isQQBrowser
};
const _Player = class _Player2 {
  constructor(el, options) {
    this.plugins = [];
    this.context = {};
    this.listeners = /* @__PURE__ */ Object.create(null);
    this.hasError = false;
    this.isSourceChanging = false;
    this.container = typeof el == "string" ? document.querySelector(el) : el;
    if (!this.container)
      throw new Error((typeof el == "string" ? el : "Element") + "does not exist");
    this.options = Object.assign({}, defaultOptions, typeof options === "string" ? {
      source: {
        src: options
      }
    } : options);
    this.locales = new I18n(this.options.lang);
    this.eventEmitter = new EventEmitter();
  }
  static make(el, options) {
    return new _Player2(el, options);
  }
  use(plugins) {
    plugins.forEach((plugin) => {
      this.plugins.push(plugin);
    });
    return this;
  }
  create() {
    this.render();
    this.initEvent();
    this.plugins.forEach(this.applyPlugin.bind(this));
    if (this.options.source.src)
      this.load(this.options.source);
    _Player2.players.push(this);
    return this;
  }
  initEvent() {
    const errorHandler = (payload) => {
      if (this.$video.error) {
        this.hasError = true;
        this.eventEmitter.emit("error", payload);
      }
    };
    this.listeners["error"] = errorHandler;
    this.$video.addEventListener("error", (e) => this.listeners["error"](e));
    const eventHandler = (eventName, payload) => {
      this.eventEmitter.emit(eventName, payload);
    };
    [[this.$video, ["fullscreenchange", "webkitbeginfullscreen", "webkitendfullscreen"], ["fullscreenerror", "webkitfullscreenerror", "mozfullscreenerror"]], [this.$root, ["fullscreenchange", "webkitfullscreenchange"], ["fullscreenerror", "webkitfullscreenerror", "mozfullscreenerror"]]].forEach((it) => {
      const target = it[0], eventNames = it.slice(1);
      eventNames.forEach((eventName) => {
        const polyfillName = eventName[0];
        this.listeners[polyfillName] = eventHandler;
        eventName.forEach((name) => {
          target.addEventListener(name, (e) => {
            this.listeners[polyfillName](polyfillName, e);
          }, {
            passive: true
          });
        });
      });
    });
    [[this.$video, VIDEO_EVENTS], [this.$root, PLAYER_EVENTS]].forEach((_ref6) => {
      let target = _ref6[0], events = _ref6[1];
      events.forEach((eventName) => {
        if (!this.listeners[eventName]) {
          this.listeners[eventName] = eventHandler;
          target.addEventListener(eventName, (e) => {
            var _a2;
            (_a2 = this.listeners) == null ? void 0 : _a2[eventName](eventName, e);
          }, {
            passive: true
          });
        }
      });
    });
  }
  render() {
    this.$video = $$1.create("video." + $$1.css("\n        width: 100%;\n        height: 100%;\n        display: block;\n        position: relative;\n      "), Object.assign({
      autoplay: this.options.autoplay,
      loop: this.options.loop,
      playsinline: this.options.playsinline,
      "webkit-playsinline": this.options.playsinline,
      "x5-playsinline": this.options.playsinline,
      preload: this.options.preload,
      poster: this.options.source.poster
    }, this.options.videoAttr));
    const _this$options = this.options, muted = _this$options.muted, volume = _this$options.volume, playbackRate = _this$options.playbackRate;
    if (!!muted)
      this.mute();
    this.$video.volume = volume;
    setTimeout(() => {
      this.setPlaybackRate(playbackRate);
    });
    this.$root = $$1.create("div." + $$1.css("\n        position: relative;\n        width: 100%;\n        height: 100%;\n        overflow: hidden;\n        background-color: #000;\n      "));
    $$1.render(this.$video, this.$root);
    $$1.render(this.$root, this.container);
  }
  async load(source) {
    var _a2;
    await ((_a2 = this.loader) == null ? void 0 : _a2.destroy());
    this.loader = void 0;
    for (const plugin of this.plugins) {
      if (plugin.load) {
        const returned = await plugin.load(this, source);
        if (returned != false && !this.loader) {
          this.loader = returned;
          this.emit("loaderchange", returned);
          break;
        }
      }
    }
    if (!this.loader) {
      this.$video.src = source.src;
    }
    return source;
  }
  applyPlugin(plugin) {
    const returned = plugin.apply(this);
    const name = plugin.name, key = plugin.key;
    if (returned) {
      this.context[key || name] = returned;
    }
  }
  on(name, listener) {
    if (typeof name === "string") {
      this.eventEmitter.on(name, listener);
    } else if (Array.isArray(name)) {
      this.eventEmitter.onAny(name, listener);
    } else if (typeof name === "function") {
      this.eventEmitter.on("*", name);
    }
    return this;
  }
  once(name, listener) {
    this.eventEmitter.once(name, listener);
  }
  off(name, listener) {
    this.eventEmitter.off(name, listener);
  }
  emit(name, payload) {
    this.eventEmitter.emit(name, payload);
  }
  setPoster(poster) {
    this.$video.poster = poster;
  }
  play() {
    if (!this.$video.src || this.isSourceChanging)
      return;
    if (this.options.autopause) {
      for (let i = 0; i < _Player2.players.length; i++) {
        const player = _Player2.players[i];
        if (player != this)
          player.pause();
      }
    }
    return this.$video.play();
  }
  pause() {
    return this.$video.pause();
  }
  togglePlay() {
    if (this.isPlaying) {
      return this.pause();
    } else {
      return this.play();
    }
  }
  mute() {
    this.$video.muted = true;
  }
  unmute() {
    this.$video.muted = false;
  }
  toggleMute() {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }
  setVolume(volume) {
    this.$video.volume = volume > 1 ? 1 : volume < 0 ? 0 : volume;
    if (this.$video.volume > 0 && this.isMuted) {
      this.unmute();
    }
  }
  setPlaybackRate(rate) {
    this.$video.playbackRate = rate;
  }
  seek(time) {
    this.$video.currentTime = time;
  }
  setLoop(loop) {
    this.$video.loop = loop;
  }
  async enterFullscreen() {
    if (this.isInPip)
      await this.exitPip();
    if (this._requestFullscreen) {
      this._requestFullscreen.call(this.$root, {
        navigationUI: "hide"
      });
    } else {
      this.$video.webkitEnterFullscreen();
    }
  }
  exitFullscreen() {
    return this._exitFullscreen.call(document);
  }
  get isFullscreenEnabled() {
    return document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled || this.$video.webkitEnterFullscreen;
  }
  get isFullScreen() {
    return Boolean((document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) === this.$root || //ios
    this.$video.webkitDisplayingFullscreen);
  }
  toggleFullScreen() {
    if (this.isFullScreen) {
      return this.exitFullscreen();
    } else {
      return this.enterFullscreen();
    }
  }
  get isPipEnabled() {
    return document.pictureInPictureEnabled;
  }
  enterPip() {
    return this.$video.requestPictureInPicture();
  }
  exitPip() {
    if (this.isInPip) {
      return document.exitPictureInPicture();
    }
    return false;
  }
  get isInPip() {
    return document.pictureInPictureElement == this.$video;
  }
  togglePip() {
    if (this.isInPip) {
      return this.exitPip();
    } else {
      return this.enterPip();
    }
  }
  _resetStatus() {
    this.hasError = false;
    if (this.isPlaying) {
      this.$video.pause();
    }
  }
  changeQuality(source) {
    this.isSourceChanging = true;
    this.emit("videoqualitychange", source);
    return this._loader(source, {
      keepPlaying: true,
      keepTime: true,
      event: "videoqualitychanged"
    });
  }
  changeSource(source) {
    let keepPlaying = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
    this.isSourceChanging = true;
    this.emit("videosourcechange", source);
    return this._loader(source, {
      keepPlaying,
      event: "videosourcechanged"
    });
  }
  //TODO: cancel previous promise
  _loader(sourceLike, options) {
    const isPlaying = this.isPlaying, currentTime = this.currentTime, volume = this.volume, playbackRate = this.playbackRate;
    const keepPlaying = options.keepPlaying, keepTime = options.keepTime;
    const isPreloadNone = this.options.preload == "none";
    const canplay = isPreloadNone ? "loadstart" : "loadedmetadata";
    const shouldPlay = keepPlaying && isPlaying;
    let finalSource;
    this._resetStatus();
    return new Promise((resolve, reject) => {
      const errorHandler = (e) => {
        this.isSourceChanging = false;
        this.off(canplay, canplayHandler);
        reject(e);
      };
      const canplayHandler = () => {
        this.isSourceChanging = false;
        this.off("error", errorHandler);
        this.emit(options.event, finalSource);
        if (volume != this.volume)
          this.setVolume(volume);
        if (playbackRate != this.playbackRate)
          this.setPlaybackRate(playbackRate);
        if (isPreloadNone && keepTime)
          this.$video.load();
        if (keepTime && !this.options.isLive)
          this.seek(currentTime);
        if (shouldPlay && !this.isPlaying)
          this.$video.play();
        resolve();
      };
      return (sourceLike instanceof Promise ? sourceLike : Promise.resolve(sourceLike)).then((source) => {
        if (!source.src)
          throw new Error("Empty Source");
        finalSource = source;
        this.$video.poster = source.poster || "";
        Object.assign(this.options.source, source);
        this.once("error", errorHandler);
        this.once(canplay, canplayHandler);
        return source;
      }).then((source) => this.load(source)).catch(errorHandler);
    });
  }
  destroy() {
    _Player2.players.splice(_Player2.players.indexOf(this), 1);
    const eventEmitter = this.eventEmitter, loader = this.loader, plugins = this.plugins, container = this.container, $root = this.$root, $video = this.$video, isPlaying = this.isPlaying, isFullScreen = this.isFullScreen, isInPip = this.isInPip;
    eventEmitter.emit("destroy");
    eventEmitter.offAll();
    loader == null ? void 0 : loader.destroy();
    plugins.forEach((it) => {
      var _a2;
      return !it.load && ((_a2 = it.destroy) == null ? void 0 : _a2.call(it));
    });
    if (isPlaying)
      this.pause();
    if (isFullScreen)
      this.exitFullscreen();
    if (isInPip)
      this.exitPip();
    if ($video.src)
      URL.revokeObjectURL($video.src);
    container.removeChild($root);
    this.eventEmitter = this.locales = this.options = this.listeners = this.context = this.plugins = this.container = this.$root = this.$video = this.loader = void 0;
  }
  get isNativeUI() {
    return this.options.isNativeUI();
  }
  get state() {
    return this.$video.readyState;
  }
  get isPlaying() {
    return !this.$video.paused;
  }
  get isMuted() {
    return this.$video.muted;
  }
  get isEnded() {
    return this.$video.ended;
  }
  get isLoop() {
    return this.$video.loop;
  }
  get isAutoPlay() {
    return this.$video.autoplay;
  }
  get duration() {
    return this.$video.duration;
  }
  get buffered() {
    return this.$video.buffered;
  }
  get currentTime() {
    return this.$video.currentTime;
  }
  get volume() {
    return this.$video.volume;
  }
  get playbackRate() {
    return this.$video.playbackRate;
  }
  get _requestFullscreen() {
    return HTMLElement.prototype.requestFullscreen || HTMLElement.prototype.webkitRequestFullscreen || HTMLElement.prototype.mozRequestFullScreen || HTMLElement.prototype.msRequestFullscreen;
  }
  get _exitFullscreen() {
    return Document.prototype.exitFullscreen || Document.prototype.webkitExitFullscreen || Document.prototype.cancelFullScreen || Document.prototype.mozCancelFullScreen || Document.prototype.msExitFullscreen;
  }
  static get version() {
    return "1.2.31";
  }
};
_Player.players = [];
let Player = _Player;
export {
  $,
  EVENTS,
  OH_EVENTS,
  PLAYER_EVENTS,
  Player,
  VIDEO_EVENTS,
  Player as default,
  isIOS,
  isMobile,
  isObject,
  isPlainObject,
  isQQBrowser,
  isSafari,
  isUndefined,
  isiPad,
  isiPhone,
  loadSDK,
  loadScript,
  mergeDeep
};
