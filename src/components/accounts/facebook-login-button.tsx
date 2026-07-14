"use client";

import { useEffect, useRef } from "react";
import {
  fbParseXfbml,
  installCheckLoginStateGlobal,
  loadFacebookSdk,
  uninstallCheckLoginStateGlobal,
} from "@/lib/facebook-sdk";

type Props = {
  appId: string;
  /** Facebook Login for Business configuration ID */
  configId?: string | null;
  sdkVersion?: string;
};

/**
 * Official Meta markup:
 * <fb:login-button
 *   config_id="{config_id}"
 *   onlogin="checkLoginState();">
 * </fb:login-button>
 *
 * checkLoginState is a global that runs:
 *   FB.getLoginStatus(function(response) { statusChangeCallback(response); });
 */
export function FacebookLoginButton({
  appId,
  configId,
  sdkVersion = "v21.0",
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    installCheckLoginStateGlobal();

    let cancelled = false;
    (async () => {
      await loadFacebookSdk(appId, sdkVersion);
      if (cancelled || !hostRef.current) return;
      hostRef.current.innerHTML = "";

      // Prefer classic XFBML tag so config_id / onlogin match Meta docs
      const btn = document.createElement("fb:login-button");
      btn.setAttribute("size", "large");
      btn.setAttribute("button_type", "continue_with");
      btn.setAttribute("use_continue_as", "true");
      btn.setAttribute("onlogin", "checkLoginState();");
      if (configId) {
        btn.setAttribute("config_id", configId);
      } else {
        btn.setAttribute("scope", "public_profile");
      }
      hostRef.current.appendChild(btn);
      fbParseXfbml(hostRef.current);
    })().catch(() => {});

    return () => {
      cancelled = true;
      uninstallCheckLoginStateGlobal();
    };
  }, [appId, configId, sdkVersion]);

  return (
    <div className="flex min-h-[40px] items-center">
      <div ref={hostRef} />
    </div>
  );
}
