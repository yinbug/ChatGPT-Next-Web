import { NextRequest } from "next/server";
import { getServerSideConfig } from "../config/server";
// import md5 from "spark-md5";
import { ACCESS_CODE_PREFIX } from "../constant";
import { getToken } from "next-auth/jwt";
import { defaultAuthOption } from "@/app/wqzcir/next-auth-option";

function getIP(req: NextRequest) {
  let ip = req.ip ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }

  return ip;
}

function parseApiKey(bearToken: string) {
  const token = bearToken.trim().replaceAll("Bearer ", "").trim();
  const isOpenAiKey = !token.startsWith(ACCESS_CODE_PREFIX);

  return {
    accessCode: isOpenAiKey ? "" : token.slice(ACCESS_CODE_PREFIX.length),
    apiKey: isOpenAiKey ? token : "",
  };
}

function parseJwt(bearToken: string) {
  const token = bearToken.trim().replaceAll("Bearer ", "").trim();

  return {
    accessCode: token.slice(ACCESS_CODE_PREFIX.length),
    apiKey: "",
  };
}

export async function auth(req: NextRequest) {
  const authToken = req.headers.get("Authorization") ?? "";

  const ip = getIP(req);
  console.log("[User IP] ", ip);

  // 预留的jwt验证模式
  const { accessCode, apiKey: token } = parseJwt(authToken);
  const cookieName = defaultAuthOption.cookies?.sessionToken?.name;
  const jwToken = await getToken({ req, cookieName });

  console.log("[JWT DATA]", jwToken);
  console.log("[Auth] got access code:", accessCode);
  console.log("[Time] ", new Date().toLocaleString());

  // 使用session验证方式替代官方的密码验证
  if (!jwToken) {
    return {
      error: true,
      msg: "用户未登录",
    };
  }

  const serverConfig = getServerSideConfig();

  // if user does not provide an api key, inject system api key
  if (!token) {
    const apiKey = serverConfig.apiKey;
    if (apiKey) {
      console.log("[Auth] use system api key");
      req.headers.set("Authorization", `Bearer ${apiKey}`);
    } else {
      console.log("[Auth] admin did not provide an api key");
    }
  } else {
    console.log("[Auth] use user api key");
  }

  return {
    error: false,
  };
}
