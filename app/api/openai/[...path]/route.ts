import { OpenaiPath } from "@/app/constant";
import { prettyObject } from "@/app/utils/format";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../auth";
import { requestOpenai } from "../../common";
import { getServerSession } from "next-auth/next";
import { defaultAuthOption } from "@/app/wqzcir/next-auth-option";
import { promisePool } from "@/app/wqzcir/mysql-client";

const ALLOWD_PATH = new Set(Object.values(OpenaiPath));

function getIP(req: NextRequest) {
  let ip = req.ip ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }

  return ip;
}

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  console.log("[OpenAI Route] params ", params);
  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  const subpath = params.path.join("/");

  if (!ALLOWD_PATH.has(subpath)) {
    console.log("[OpenAI Route] forbidden path ", subpath);
    return NextResponse.json(
      {
        error: true,
        msg: "you are not allowed to request " + subpath,
      },
      {
        status: 403,
      },
    );
  }

  const session = await getServerSession(defaultAuthOption);
  let uid = session?.user.id;
  console.log("[访问session] ", session, uid);
  const authResult = await auth(req);
  if (authResult.error) {
    return NextResponse.json(authResult, {
      status: 401,
    });
  }

  let clonedBody = null;
  if (req.body) {
    clonedBody = await req.clone().json();
  }

  let bodyMsg = clonedBody?.messages ?? [];
  let userLogs = bodyMsg.filter((i: any) => i?.role === "user");
  let userLogsLen = userLogs.length;
  // 记录用户最新的消息文本
  if (userLogsLen) {
    const postLogs = {
      application_name: "chatgpt",
      username: uid,
      ip: getIP(req),
      content: userLogs[userLogsLen - 1].content,
      useragent: req.headers.get("User-Agent"),
      url: req.url,
      type: 2,
      create_time: Date.now() / 1000,
      remark: "用户提问",
    };

    await promisePool.query("INSERT INTO cd_log SET ?", postLogs);
  }

  try {
    return await requestOpenai(req);
  } catch (e) {
    console.error("[OpenAI] ", e);
    return NextResponse.json(prettyObject(e));
  }
}

export const GET = handle;
export const POST = handle;

// export const runtime = "edge";
export const runtime = "nodejs";
