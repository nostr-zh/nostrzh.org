import type { EventTemplate } from "nostr-tools";
import {
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  nip19,
} from "nostr-tools";
import { BunkerSigner, parseBunkerInput } from "nostr-tools/nip46";
import { hexToBytes } from "nostr-tools/utils";
import { useEffect, useState } from "react";
import { BACKEND_SERVER_URL } from "../constants";
import { getNostrAuthToken } from "../lib/nostr";
import Avatar from "./Avatar";
import Username from "./Username";

export default function Nip05Register() {
  const [pubkey, setPubkey] = useState<string>("");
  const [privateKey, setPrivateKey] = useState("");
  const [nip46Token, setNip46Token] = useState("");
  const [name, setName] = useState("");
  const [currentNip05, setCurrentNip05] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [signer, setSigner] = useState<any>(null);

  // 检查现有的 NIP-05
  useEffect(() => {
    if (pubkey) {
      checkExistingNip05(pubkey);
    }
  }, [pubkey]);

  const checkExistingNip05 = async (userPubkey: string) => {
    try {
      const response = await fetch(
        `${BACKEND_SERVER_URL}/.well-known/nostr.json`
      );
      const data = await response.json();
      console.log("Fetched nostr.json:", data);

      if (data.names) {
        const existingName = Object.entries(data.names).find(
          ([_, pk]) => pk === userPubkey
        );
        if (existingName) {
          setCurrentNip05(existingName[0] as string);
          setName(existingName[0] as string);
        }
      }
    } catch (err) {
      console.error("Failed to check existing NIP-05:", err);
    }
  };

  const handleExtensionLogin = async () => {
    if (!window.nostr) {
      setError("未检测到 Nostr 浏览器插件，请先安装插件（如 nos2x、Alby 等）");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const pk = await window.nostr.getPublicKey();
      setPubkey(pk);
      setSigner(window.nostr);
    } catch (err) {
      setError("获取公钥失败，请检查插件设置");
    } finally {
      setLoading(false);
    }
  };

  const handleNip46Login = async () => {
    if (!nip46Token.trim()) {
      setError("请输入 Bunker 连接字符串");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const bunkerPointer = await parseBunkerInput(nip46Token);
      if (!bunkerPointer) {
        throw new Error("无效的 Bunker 连接字符串");
      }

      const signer = BunkerSigner.fromBunker(
        generateSecretKey(),
        bunkerPointer,
        {
          onauth: (url) => {
            window.open(url, "_blank");
          },
        }
      );

      await signer.connect();
      const pubkey = await signer.getPublicKey();
      setPubkey(pubkey);
      setSigner(signer);
    } catch (err) {
      setError("Bunker 连接失败，请检查连接字符串是否正确");
    } finally {
      setLoading(false);
    }
  };

  const handlePrivateKeyLogin = async () => {
    if (!privateKey.trim()) {
      setError("请输入私钥");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let sk: Uint8Array;
      // 支持 hex 或 nsec 格式
      if (privateKey.startsWith("nsec")) {
        const decoded = nip19.decode(privateKey);
        if (decoded.type !== "nsec") {
          throw new Error("无效的私钥格式");
        }
        sk = decoded.data;
      } else {
        if (/^[0-9a-f]{64}$/.test(privateKey) === false) {
          throw new Error("无效的私钥格式");
        }
        sk = hexToBytes(privateKey);
      }

      const pk = getPublicKey(sk);
      setPubkey(pk);
      setSigner({
        getPublicKey: async () => pk,
        signEvent: async (event: EventTemplate) => {
          return finalizeEvent(event, sk);
        },
      });
    } catch (err) {
      setError("私钥格式错误，请输入有效的私钥（hex 或 nsec 格式）");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setPubkey("");
    setPrivateKey("");
    setNip46Token("");
    setName("");
    setCurrentNip05(null);
    setSigner(null);
    setError("");
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pubkey || !signer) {
      setError("请先登录");
      return;
    }

    if (name.length < 2 || name.length > 15) {
      setError("NIP-05 标识长度应为 2-15 个字符");
      return;
    }

    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const url = `${BACKEND_SERVER_URL}/v1/nip05/register`;
      const method = "POST";
      const payload = { name };
      const token = await getNostrAuthToken({
        url,
        method,
        payload,
        pubkey,
        signer,
      });
      const response = await fetch(`${BACKEND_SERVER_URL}/v1/nip05/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setCurrentNip05(name);
        setName(name); // 更新为规范化的名称
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("注册失败,请稍后再试");
      }
    } catch (err) {
      setError("网络错误,请检查连接后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
      {!pubkey ? (
        /* 登录界面 */
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              登录以注册 NIP-05
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              请选择一种登录方式
            </p>
          </div>

          {/* 浏览器插件登录 */}
          <div className="space-y-3">
            <button
              onClick={handleExtensionLogin}
              disabled={loading}
              className="cursor-pointer w-full px-6 py-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              使用浏览器插件登录
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              需要安装 Nostr 浏览器插件（如 nos2x、Alby 等）
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                或
              </span>
            </div>
          </div>

          {/* 远程签名器登录（Bunker） */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                远程签名器（Bunker）
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={nip46Token}
                  onChange={(e) => setNip46Token(e.target.value)}
                  placeholder="输入 bunker:// 连接字符串"
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
                <button
                  onClick={handleNip46Login}
                  disabled={loading || !nip46Token.trim()}
                  className="cursor-pointer shrink-0 px-6 py-3 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  连接
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                或
              </span>
            </div>
          </div>

          {/* 私钥登录 */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                使用私钥登录
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="输入私钥（hex 或 nsec 格式）"
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
                <button
                  onClick={handlePrivateKeyLogin}
                  disabled={loading || !privateKey.trim()}
                  className="cursor-pointer shrink-0 px-6 py-3 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  登录
                </button>
              </div>
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                ⚠️ 私钥非常重要，请确保在安全的环境下使用
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      ) : (
        /* 注册界面 */
        <div>
          <div className="mb-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  已登录
                </p>
                <div className="flex items-center gap-2">
                  <Avatar pubkey={pubkey} />
                  <Username pubkey={pubkey} />
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="cursor-pointer text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                退出
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                {currentNip05 ? "更新 NIP-05 标识" : "注册 NIP-05 标识"}
              </label>
              <div className="flex items-center gap-0 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all overflow-hidden">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => {
                    const value = e.target.value.toLocaleLowerCase().trim();
                    if (value.length > 15) return;
                    // 只允许小写字母和数字
                    if (/^[a-z0-9]*$/.test(value)) {
                      setName(value);
                    }
                  }}
                  required
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="username"
                  minLength={2}
                  maxLength={15}
                  pattern="[a-z0-9]+"
                />
                <span className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-sm border-l border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
                  @nostrzh.org
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                2-15 个字符，仅支持小写英文字母和数字
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-green-700 dark:text-green-400 text-sm font-medium">
                  {currentNip05
                    ? "更新成功!"
                    : "注册成功!您的 NIP-05 标识已创建"}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="cursor-pointer w-full px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {currentNip05 ? "更新中..." : "注册中..."}
                </span>
              ) : currentNip05 ? (
                "更新"
              ) : (
                "注册"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              什么是 NIP-05?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              NIP-05 是一种将您的 Nostr
              公钥与易于记忆的标识符(类似电子邮件地址)关联的方式。注册后，你可以将{" "}
              <span className="font-mono text-purple-600 dark:text-purple-400">
                {name || "username"}@nostrzh.org
              </span>{" "}
              填入你的个人资料中，方便他人找到你并验证你的身份。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
