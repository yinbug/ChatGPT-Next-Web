import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  WQZCIR_AUTH_HOST,
  WQZCIR_AUTH_API,
  AES_IV,
  AES_KEY,
  WQZCIR_CLIENT,
  WQZCIR_OPEN_TYPE,
} from "@/app/wqzcir/constant";
import AES from "crypto-js/aes";
import HEX from "crypto-js/enc-hex";
import Base64 from "crypto-js/enc-base64";
import crypto_enc_utf8 from "crypto-js/enc-utf8";
import { defaultAuthOption } from "@/app/wqzcir/next-auth-option";

const authOptions: NextAuthOptions = {
  // 导入默认配置
  ...defaultAuthOption,
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: "Credentials",
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        account: { label: "Username", type: "text", placeholder: "账号" },
        password: { label: "Password", type: "password", placeholder: "密码" },
        sign: { label: "Sign", type: "text" },
      },
      async authorize(credentials) {
        console.log("[请求参数] ", credentials);

        let uid = null;
        let accessToken = "";
        let refreshToken = "";
        const body = credentials;
        // 存在sign则为微信登录
        if (body?.sign) {
          // 解码微信中转参数
          let codestr = HEX.parse(body.sign);
          let key = crypto_enc_utf8.parse(AES_KEY);
          let iv = crypto_enc_utf8.parse(AES_IV);
          let decrypted = AES.decrypt(Base64.stringify(codestr), key, {
            iv: iv,
          });

          let info = decrypted.toString(crypto_enc_utf8).split("|");
          console.log("[微信中转参数] ", info);
          let expires = parseInt(info[0]) * 1000;
          if (expires < Date.now()) {
            throw new Error("密钥已过期");
          }

          let urlQuery = new URLSearchParams({
            openid: info[2],
            unionid: info[1],
            client: WQZCIR_CLIENT,
            openType: WQZCIR_OPEN_TYPE,
          });
          console.log("[微信登录] ", urlQuery.toString());

          // 发起微信登录
          let url =
            WQZCIR_AUTH_HOST +
            WQZCIR_AUTH_API.WechatLogin +
            "?" +
            urlQuery.toString();

          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });
          const data = await response.json();

          if (data.status === "20011") {
            throw new Error("用户不存在");
          } else if (data.status !== "200") {
            throw new Error(data.msg);
          }

          accessToken = data.data.accessToken;
          refreshToken = data.data.refreshToken;
        } else {
          // 正常账号密码登录
          let postData2: any = {
            phone: body?.account,
            password: body?.password,
            client: WQZCIR_CLIENT,
            openType: WQZCIR_OPEN_TYPE,
          };
          console.log("[账号密码请求参数] ", postData2);

          let urlQuery = new URLSearchParams(postData2);

          let url =
            WQZCIR_AUTH_HOST +
            WQZCIR_AUTH_API.PwdLogin +
            "?" +
            urlQuery.toString();

          // 发起账号密码登录
          const responsePwd = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });
          const dataPwd = await responsePwd.json();

          if (dataPwd.status === "20011") {
            throw new Error("用户不存在");
          } else if (dataPwd.status === "20005") {
            throw new Error("账号或密码错误");
          } else if (dataPwd.status !== "200") {
            throw new Error(dataPwd.msg);
          }

          accessToken = dataPwd.data.accessToken;
          refreshToken = dataPwd.data.refreshToken;
        }

        // 获取用户uid等信息
        try {
          const responseUser = await fetch(
            WQZCIR_AUTH_HOST + WQZCIR_AUTH_API.User,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + accessToken,
              },
            },
          );

          const dataUser = await responseUser.json();
          uid = dataUser.data.userInfo.uid;
        } catch (err) {
          let msg = "网络请求异常";
          if (err instanceof Error) {
            msg = err.message;
          }
          throw new Error(msg);
        }
        const user = {
          id: uid,
          name: uid,
          email: "",
          accessToken,
          refreshToken,
        };
        return user;
      },
    }),
  ],
};
const handler = NextAuth(authOptions);
export const POST = handler;
export const GET = handler;
export const runtime = "nodejs";
