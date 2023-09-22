export const AES_KEY = "935456kwo0123wqzcir@2023";
export const AES_IV = "ipsms.wqzcir.com";

export const WECHAT_APPID = "wx9c03ffd044b38c73";
export const WECHAT_API_HOST = "https://open.weixin.qq.com";
export const WECHAT_API = {
  OauthLogin: "connect/qrconnect",
};

export const WQZCIR_OPEN_TYPE = "IR_WEB";
export const WQZCIR_CLIENT = "CHATGPT";

export const WQZCIR_AUTH_HOST =
  process.env.NODE_ENV === "production"
    ? "https://server.wise-info.cn/auth"
    : "https://test-server.wise-info.cn:8043/auth";
export const WQZCIR_AUTH_API = {
  WechatLogin: "/oauth/login-wechat",
  PwdLogin: "/oauth/login",
  User: "/user/info",
};
