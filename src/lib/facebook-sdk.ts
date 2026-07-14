/**
 * Facebook JavaScript SDK loader + login helpers (client-only).
 * Docs: FB.getLoginStatus / FB.login
 */

export type FbAuthResponse = {
  accessToken: string;
  userID: string;
  expiresIn?: number;
  signedRequest?: string;
};

export type FbLoginStatusResponse = {
  status: "connected" | "not_authorized" | "unknown";
  authResponse?: FbAuthResponse | null;
};

declare global {
  interface Window {
    fbAsyncInit?: () => void;
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

export function loadFacebookSdk(appId: string, version = "v21.0"): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Facebook SDK solo funciona en el navegador"));
  }
  if (window.FB) return Promise.resolve();
  if (sdkReady) return sdkReady;

  sdkReady = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      try {
        window.FB!.init({
          appId,
          cookie: true,
          xfbml: false,
          version,
        });
        resolve();
      } catch (e) {
        reject(e);
      }
    };

    if (document.getElementById("facebook-jssdk")) {
      // script already injecting
      return;
    }

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.src = "https://connect.facebook.net/es_LA/sdk.js";
    script.onerror = () => reject(new Error("No se pudo cargar Facebook SDK"));
    document.body.appendChild(script);
  });

  return sdkReady;
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
