import styles from "./auth.module.scss";
import { IconButton } from "./button";

import { useNavigate, useLocation } from "react-router-dom";
import { Path } from "../constant";
import { useAccessStore } from "../store";
import Locale from "../locales";

import BotIcon from "../icons/bot.svg";
import WechatLogo from "../icons/wechat_logo.png";
import Image from "next/image";
import { signIn } from "next-auth/react";

let loginLock = false;

export function AuthPage() {
  const navigate = useNavigate();
  const local = useLocation();
  const access = useAccessStore();
  const goHome = () => navigate(Path.Home);
  const goAuth = () => navigate(Path.Auth);
  const urlSearch = new URLSearchParams(local.search);
  // 保存密码的变量
  let pwd = "";

  const doLogin = function (sign?: string) {
    if (loginLock) {
      return;
    }
    loginLock = true;
    let opt: any = {
      redirect: false,
      password: pwd,
      account: access.account,
    };

    if (sign) {
      opt.sign = sign;
    }
    signIn("credentials", opt)
      .then((res) => {
        console.log("[请求结果]", res);
        if (res?.error) {
          alert(res.error);
          if (sign) {
            goAuth();
          }
          return;
        }

        if (res?.url) {
          access.updateUid(1);
          goHome();
        }
      })
      .catch((err) => {
        console.error("[Login] failed to fetch login", err);
        let msg = err instanceof Error ? err.message : "网络异常";
        alert("登录失败: " + msg);
        goHome();
      })
      .finally(() => {
        loginLock = false;
      });
  };

  // 如果存在sign参数，则进行微信登录
  if (urlSearch.has("sign")) {
    doLogin(urlSearch.get("sign") ?? undefined);
    return <div style={{ margin: "50vh auto" }}>登录中……</div>;
  }

  return (
    <div className={styles["auth-page"]}>
      <div className={`no-dark ${styles["auth-logo"]}`}>
        <BotIcon /> 智慧助手
      </div>

      <div className={styles["auth-title"]}>{Locale.Auth.Title}</div>
      <div className={styles["auth-tips"]}>{Locale.Auth.Tips}</div>
      <input
        className={styles["auth-input"]}
        type="text"
        placeholder={Locale.Auth.InputUser}
        value={access.account}
        onChange={(e) => {
          access.updateAccount(e.currentTarget.value);
        }}
      />

      <input
        className={styles["auth-input"]}
        type="password"
        placeholder={Locale.Auth.Input}
        defaultValue={pwd}
        onChange={(e) => {
          pwd = e.currentTarget.value;
        }}
      />

      <div className={styles["auth-actions"]}>
        <IconButton
          text={Locale.Auth.Confirm}
          type="primary"
          onClick={() => {
            doLogin();
          }}
        />

        <div
          className={styles["auth-wechat"]}
          onClick={(e) => {
            access.wechatLogin();
          }}
        >
          <Image
            src={WechatLogo}
            alt="微信logo"
            width={25}
            height={25}
            style={{ verticalAlign: "middle" }}
          />
          &nbsp;{Locale.Auth.WechatLogin}
        </div>

        {/* 屏蔽稍后再说文本 */}
        {/* <IconButton text={Locale.Auth.Later} onClick={goHome} /> */}
      </div>
    </div>
  );
}
