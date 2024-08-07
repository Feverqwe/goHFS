export declare const loadScript: (src: string, onLoad: () => void, onError: (e: unknown) => void) => void;
export declare const isUndefined: (value: unknown) => value is undefined;
export declare const loadSDK: <SDKType = unknown>(url: string, sdkGlobalVar: string, sdkReadyVar?: string, isLoaded?: (sdk: SDKType) => boolean, loadScriptFn?: (src: string, onLoad: () => void, onError: (e: unknown) => void) => void) => Promise<SDKType>;
//# sourceMappingURL=script.d.ts.map