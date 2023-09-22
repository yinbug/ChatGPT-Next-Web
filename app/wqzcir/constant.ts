export const AES_KEY = process.env.AES_KEY;
export const AES_IV = process.env.AES_IV;

export const WECHAT_APPID = "wx9c03ffd044b38c73";
export const WECHAT_API_HOST = "https://open.weixin.qq.com";
export const WECHAT_API = {
  OauthLogin: "connect/qrconnect",
};

export const WQZCIR_OPEN_TYPE = "IR_WEB";
export const WQZCIR_CLIENT = "CHATGPT";

export const WQZCIR_AUTH_HOST = process.env.WQZCIR_AUTH_HOST;
export const WQZCIR_AUTH_API = {
  WechatLogin: "/oauth/login-wechat",
  PwdLogin: "/oauth/login",
  User: "/user/info",
};
