/**
 * Facebook JavaScript SDK — Meta-documented login flow.
 *
 * function checkLoginState() {
 *   FB.getLoginStatus(function(response) {
 *     statusChangeCallback(response);
 *   });
 * }
 */

export type FbAuthResponse = {
  accessToken: string;
  userID: string;
  expiresIn?: number | string;
  signedRequest?: string;
};

export type FbLoginStatusResponse = {
  status: "connected" | "not_authorized" | "unknown";
  authResponse?: FbAuthResponse | null;
};

export type StatusChangeCallback = (
  response: FbLoginStatusResponse
) => void | Promise<void>;

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    /** Meta XFBML: onlogin="checkLoginState();" */
    checkLoginState?: () => void;
    FB?: {
      init: (opts: {
        appId: string;
        cookie?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      getLoginStatus: (
        cb: (response: FbLoginStatusResponse) => void,
        force?: boolean
      ) => void;
      login: (
        cb: (response: FbLoginStatusResponse) => void,
        opts?: { scope?: string; config_id?: string; return_scopes?: boolean }
      ) => void;
      logout: (cb?: () => void) => void;
      XFBML?: { parse: (el?: Element | null) => void };
      api: (
        path: string,
        methodOrCb: string | ((r: unknown) => void),
        paramsOrCb?: Record<string, string> | ((r: unknown) => void),
        cb?: (r: unknown) => void
      ) => void;
    };
  }
}

let sdkReady: Promise<void> | null = null;
let lastAppId: string | null = null;
let statusChangeCallbackRef: StatusChangeCallback | null = null;

/** Register handler used by checkLoginState → getLoginStatus */
export function setStatusChangeCallback(cb: StatusChangeCallback | null) {
  statusChangeCallbackRef = cb;
}

/**
 * Exact Meta sample:
 * FB.getLoginStatus(function(response) { statusChangeCallback(response); });
 */
export function checkLoginState() {
  if (!window.FB) {
    console.warn("[FB] SDK not ready in checkLoginState");
    return;
  }
  window.FB.getLoginStatus(function (response) {
    void statusChangeCallbackRef?.(response);
  });
}

/** Install global for <fb:login-button onlogin="checkLoginState();"> */
export function installCheckLoginStateGlobal() {
  window.checkLoginState = checkLoginState;
}

export function uninstallCheckLoginStateGlobal() {
  if (window.checkLoginState === checkLoginState) {
    delete window.checkLoginState;
  }
}

export function loadFacebookSdk(appId: string, version = "v21.0"): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Facebook SDK solo funciona en el navegador"));
  }
  if (window.FB && lastAppId === appId) return Promise.resolve();
  if (sdkReady && lastAppId === appId) return sdkReady;

  lastAppId = appId;
  sdkReady = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      try {
        window.FB!.init({
          appId,
          cookie: true,
          xfbml: true,
          version,
        });
        installCheckLoginStateGlobal();
        resolve();
      } catch (e) {
        reject(e);
      }
    };

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.src = "https://connect.facebook.net/es_LA/sdk.js";
      script.onerror = () => reject(new Error("No se pudo cargar Facebook SDK"));
      document.body.appendChild(script);
    } else if (window.FB) {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: true,
        version,
      });
      installCheckLoginStateGlobal();
      resolve();
    }
  });

  return sdkReady;
}

export function fbParseXfbml(container?: Element | null) {
  window.FB?.XFBML?.parse(container ?? undefined);
}

export function fbGetLoginStatus(force = false): Promise<FbLoginStatusResponse> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error("FB SDK no inicializado"));
      return;
    }
    window.FB.getLoginStatus((response) => resolve(response), force);
  });
}

export function fbLogin(opts?: {
  scope?: string;
  configId?: string;
}): Promise<FbLoginStatusResponse> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error("FB SDK no inicializado"));
      return;
    }
    const params: { scope?: string; config_id?: string; return_scopes?: boolean } = {
      return_scopes: true,
    };
    if (opts?.configId) params.config_id = opts.configId;
    else if (opts?.scope) params.scope = opts.scope;
    else params.scope = "public_profile";

    window.FB.login((response) => resolve(response), params);
  });
}
