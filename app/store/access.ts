import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_API_HOST, StoreKey } from "../constant";
import { getHeaders } from "../client/api";
import { BOT_HELLO } from "./chat";
import { ALL_MODELS } from "./config";
import { getClientConfig } from "../config/client";
import {
  WECHAT_API,
  WECHAT_APPID,
  WECHAT_API_HOST,
} from "@/app/wqzcir/constant";

export interface AccessControlStore {
  account: string;
  accessCode: string;
  token: string;
  uid: number;

  needCode: boolean;
  hideUserApiKey: boolean;
  openaiUrl: string;

  updateAccount: (_: string) => void;
  updateUid: (_: number) => void;
  updateToken: (_: string) => void;
  updateCode: (_: string) => void;
  updateOpenAiUrl: (_: string) => void;
  enabledAccessControl: () => boolean;
  isAuthorized: () => boolean;
  fetch: () => void;
  wechatLogin: (redirect_uri?: string, state?: string) => void;
}

let fetchState = 0; // 0 not fetch, 1 fetching, 2 done

const DEFAULT_OPENAI_URL =
  getClientConfig()?.buildMode === "export" ? DEFAULT_API_HOST : "/api/openai/";
console.log("[API] default openai url", DEFAULT_OPENAI_URL);

export const useAccessStore = create<AccessControlStore>()(
  persist(
    (set, get) => ({
      token: "",
      accessCode: "",
      account: "",
      uid: 0,
      needCode: true,
      hideUserApiKey: false,
      openaiUrl: DEFAULT_OPENAI_URL,

      enabledAccessControl() {
        get().fetch();

        return get().needCode;
      },
      /**
       * 发起微信登录
       * @param redirect_uri 回调url
       * @param state 传递参数
       */
      wechatLogin(redirect_uri: string = "", state: string = "") {
        if (!state) {
          state = "wechatLogin";
        }
        if (!redirect_uri) {
          redirect_uri =
            location.protocol +
            "//interface.wise-info.cn/wechat/chatgpt_callback";
        }
        redirect_uri = encodeURIComponent(redirect_uri);
        location.href = `${WECHAT_API_HOST}/${WECHAT_API.OauthLogin}?appid=${WECHAT_APPID}&redirect_uri=${redirect_uri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;
      },
      updateUid(uid: number) {
        set(() => ({ uid }));
      },
      updateCode(code: string) {
        set(() => ({ accessCode: code }));
      },
      updateToken(token: string) {
        set(() => ({ token }));
      },
      updateAccount(account: string) {
        set(() => ({ account }));
      },
      updateOpenAiUrl(url: string) {
        set(() => ({ openaiUrl: url }));
      },
      isAuthorized() {
        get().fetch();
        return !!get().uid;
        // has token or has code or disabled access control
        // return (
        //   !!get().token || !!get().accessCode || !get().enabledAccessControl()
        // );
      },
      fetch() {
        if (fetchState > 0 || getClientConfig()?.buildMode === "export") return;
        fetchState = 1;
        fetch("/api/config", {
          method: "post",
          body: null,
          headers: {
            ...getHeaders(),
          },
        })
          .then((res) => res.json())
          .then((res: DangerConfig) => {
            console.log("[Config] got config from server", res);
            set(() => ({ ...res }));

            if (!res.enableGPT4) {
              ALL_MODELS.forEach((model) => {
                if (model.name.startsWith("gpt-4")) {
                  (model as any).available = false;
                }
              });
            }

            if ((res as any).botHello) {
              BOT_HELLO.content = (res as any).botHello;
            }
          })
          .catch(() => {
            console.error("[Config] failed to fetch config");
          })
          .finally(() => {
            fetchState = 2;
          });
      },
    }),
    {
      name: StoreKey.Access,
      version: 1,
    },
  ),
);
