"use client";

import { useEffect, useRef } from "react";
import { fbParseXfbml, loadFacebookSdk } from "@/lib/facebook-sdk";

type Props = {
  appId: string;
  /** Facebook Login for Business configuration ID */
  configId?: string | null;
  sdkVersion?: string;
  onLogin: () => void;
};

/**
 * Official Meta markup:
 * <fb:login-button config_id="{config_id}" onlogin="checkLoginState();">
 */
export function FacebookLoginButton({
  appId,
  configId,
  sdkVersion = "v21.0",
  onLogin,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Meta XFBML calls this global after the button login finishes
    window.checkLoginState = () => {
      onLogin();
    };

    let cancelled = false;
    (async () => {
      await loadFacebookSdk(appId, sdkVersion);
      if (cancelled || !hostRef.current) return;
      hostRef.current.innerHTML = "";
      const btn = document.createElement("div");
      btn.className = "fb-login-button";
      btn.setAttribute("data-width", "");
      btn.setAttribute("data-size", "large");
      btn.setAttribute("data-button-type", "continue_with");
      btn.setAttribute("data-layout", "default");
      btn.setAttribute("data-auto-logout-link", "false");
      btn.setAttribute("data-use-continue-as", "true");
      btn.setAttribute("data-onlogin", "checkLoginState();");
      if (configId) {
        btn.setAttribute("data-config-id", configId);
      } else {
        btn.setAttribute("data-scope", "public_profile");
      }
      hostRef.current.appendChild(btn);
      fbParseXfbml(hostRef.current);
    })().catch(() => {
      /* parent shows toast on manual connect */
    });

    return () => {
      cancelled = true;
      if (window.checkLoginState) delete window.checkLoginState;
    };
  }, [appId, configId, sdkVersion, onLogin]);

  return (
    <div className="min-h-[40px] flex items-center">
      <div ref={hostRef} />
    </div>
  );
}
