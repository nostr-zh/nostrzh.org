import { pool } from "@nostr/gadgets/global";
import dayjs from "dayjs";
import { Download, ExternalLink } from "lucide-react";
import {
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  kinds,
  nip19,
} from "nostr-tools";
import { useCallback, useState } from "react";
import { BACKEND_SERVER_URL, DEFAULT_RELAY_URLS } from "../../constants";
import { useWhitelistUsers } from "../../hooks/useWhitelistUsers";
import { getNostrAuthToken } from "../../lib/nostr";
import CopyButton from "./CopyButton";
import Modal from "./Modal";

type ModalType = "create-account" | "quiz" | "success" | null;

interface Question {
  question: string;
  options: string[];
}

interface QuizSession {
  sessionId: string;
  questions: Question[];
  config: {
    questionsPerSession: number;
    passingScore: number;
    sessionTTLMinutes: number;
  };
}

interface NewAccount {
  secretKey: Uint8Array;
  publicKey: string;
  npub: string;
  nsec: string;
}

export default function JoinCommunity() {
  const [modal, setModal] = useState<ModalType>(null);
  const [pubkeyInput, setPubkeyInput] = useState("");
  const [hexPubkey, setHexPubkey] = useState("");
  const [npubDisplay, setNpubDisplay] = useState("");
  const { users: whitelistUsers } = useWhitelistUsers();
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Quiz state
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [quizError, setQuizError] = useState("");
  const [quizResult, setQuizResult] = useState<{
    passed: boolean;
    correctCount: number;
  } | null>(null);

  // Account creation state
  const [newAccount, setNewAccount] = useState<NewAccount | null>(null);

  const parsePubkey = useCallback(
    (
      input: string
    ): { hex: string; npub: string; error?: string } | { error: string } => {
      const trimmed = input.trim();

      // Try npub format
      if (trimmed.startsWith("npub1")) {
        try {
          const decoded = nip19.decode(trimmed);
          if (decoded.type === "npub") {
            return {
              hex: decoded.data,
              npub: trimmed,
            };
          }
        } catch {
          return { error: "无效的 npub 格式" };
        }
      }

      // Try hex format (64 characters)
      if (/^[0-9a-fA-F]{64}\$/.test(trimmed)) {
        try {
          const npub = nip19.npubEncode(trimmed);
          return { hex: trimmed.toLowerCase(), npub };
        } catch {
          return { error: "无效的公钥格式" };
        }
      }

      return { error: "请输入有效的 npub 或 hex 格式公钥" };
    },
    []
  );

  const handleCheckPubkey = useCallback(() => {
    setError("");
    const result = parsePubkey(pubkeyInput);

    if ("error" in result && !("hex" in result)) {
      setError(result.error);
      return;
    }

    const { hex, npub } = result as { hex: string; npub: string };
    setHexPubkey(hex);
    setNpubDisplay(npub);

    if (whitelistUsers.includes(hex)) {
      setIsWhitelisted(true);
    } else {
      setIsWhitelisted(false);
      startQuiz(hex);
    }
  }, [pubkeyInput, parsePubkey, whitelistUsers]);

  const handleCreateAccount = useCallback(() => {
    const secretKey = generateSecretKey();
    const publicKey = getPublicKey(secretKey);
    const npub = nip19.npubEncode(publicKey);
    const nsec = nip19.nsecEncode(secretKey);

    setNewAccount({ secretKey, publicKey, npub, nsec });
    setModal("create-account");
  }, []);

  const handleDownloadKeys = useCallback(() => {
    if (!newAccount) return;

    const content = `Nostr 密钥文件 - 请妥善保管！
=====================================

公钥 (npub): ${newAccount.npub}
私钥 (nsec): ${newAccount.nsec}

=====================================
警告：
- 私钥就是你的账号，泄露私钥等于丢失账号
- 请将此文件保存在安全的地方
- 建议进行多处备份
- 永远不要分享你的私钥（nsec）
=====================================

生成时间: ${new Date().toISOString()}
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nostr-keys-${newAccount.npub.slice(0, 12)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [newAccount]);

  const handleConfirmAccount = useCallback(async () => {
    if (!newAccount) return;

    const contactEvent = finalizeEvent(
      {
        kind: kinds.Contacts,
        tags: [],
        content: "",
        created_at: dayjs().unix(),
      },
      newAccount.secretKey
    );
    const relayListEvent = finalizeEvent(
      {
        kind: kinds.RelayList,
        tags: [
          ["r", "wss://relay.nostrzh.org/", "write"],
          ...DEFAULT_RELAY_URLS.map((url, index) =>
            index < DEFAULT_RELAY_URLS.length - 1 // 最后一个只读
              ? ["r", url]
              : ["r", url, "read"]
          ),
        ],
        content: "",
        created_at: dayjs().unix(),
      },
      newAccount.secretKey
    );
    const favoriteRelaysEvent = finalizeEvent(
      {
        kind: 10012,
        tags: [["relay", "wss://relay.nostrzh.org/"]],
        content: "",
        created_at: dayjs().unix(),
      },
      newAccount.secretKey
    );

    await Promise.all([
      pool.publish(DEFAULT_RELAY_URLS, contactEvent),
      pool.publish(DEFAULT_RELAY_URLS, relayListEvent),
      pool.publish(DEFAULT_RELAY_URLS, favoriteRelaysEvent),
    ]);

    setHexPubkey(newAccount.publicKey);
    setNpubDisplay(newAccount.npub);
    startQuiz(newAccount.publicKey);
  }, [newAccount]);

  const startQuiz = async (pubkey: string) => {
    setLoading(true);
    setQuizError("");
    setQuizResult(null);

    try {
      const res = await fetch(`${BACKEND_SERVER_URL}/v1/quiz/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pubkey }),
      });

      if (!res.ok) {
        throw new Error("获取题目失败");
      }

      const data: QuizSession = await res.json();
      setQuizSession(data);
      setAnswers(new Array(data.questions.length).fill(null));
      setModal("quiz");
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = optionIndex;
      return newAnswers;
    });
  };

  const handleSubmitQuiz = async () => {
    if (!quizSession || answers.some((a) => a === null)) {
      setQuizError("请回答所有问题");
      return;
    }

    setLoading(true);
    setQuizError("");

    try {
      const res = await fetch(`${BACKEND_SERVER_URL}/v1/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: quizSession.sessionId,
          answers: answers,
        }),
      });

      if (!res.ok) {
        throw new Error("提交答案失败");
      }

      const result = await res.json();
      setQuizResult(result);

      if (result.passed) {
        // Join community
        const url = `${BACKEND_SERVER_URL}/v1/users/join`;
        const method = "POST";
        const payload = { pubkey: hexPubkey };
        const token = await getNostrAuthToken({
          url,
          method,
          payload,
          difficulty: 20,
        });

        const joinRes = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json", Authorization: token },
          body: JSON.stringify(payload),
        });

        if (!joinRes.ok) {
          throw new Error("加入社区失败");
        }

        setModal("success");
      }
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  const handleRetryQuiz = () => {
    setQuizResult(null);
    startQuiz(hexPubkey);
  };

  const handleComplete = () => {
    window.open(
      newAccount?.nsec
        ? `https://jumble.social?r=relay.nostrzh.org#nostr-login=${newAccount.nsec}`
        : "https://jumble.social?r=relay.nostrzh.org",
      "_blank",
      "noopener noreferrer"
    );

    setModal(null);
    setPubkeyInput("");
    setHexPubkey("");
    setNewAccount(null);
  };

  const closeModal = () => {
    setModal(null);
  };

  return (
    <>
      <div className="mt-8 p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
          加入社区
        </h4>

        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            输入你的 Nostr 公钥加入社区
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={pubkeyInput}
              onChange={(e) => setPubkeyInput(e.target.value)}
              placeholder="npub1... 或 hex 公钥"
              className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleCheckPubkey}
              disabled={!pubkeyInput.trim() || loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? "检查中..." : "验证"}
            </button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              还没有 Nostr 账号？
            </p>
            <button
              onClick={handleCreateAccount}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              创建新账号
            </button>
          </div>
        </div>
      </div>

      {/* Already Whitelisted Modal */}
      <Modal
        isOpen={isWhitelisted}
        onClose={() => setIsWhitelisted(false)}
        title="已加入社区"
      >
        <div className="space-y-4 text-center">
          <div className="p-6 bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-lg font-semibold text-purple-700 dark:text-purple-300">
              你已经是 Nostr 中文社区的一员了！
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleComplete}
              className="px-6 py-2 w-full flex flex-col items-center bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                开始使用 <ExternalLink className="size-4" />
              </div>
            </button>

            <a
              href="/nip05"
              className="px-4 py-2 w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              注册 NIP-05
            </a>
          </div>
        </div>
      </Modal>

      {/* Create Account Modal */}
      <Modal
        isOpen={modal === "create-account"}
        onClose={closeModal}
        title="创建 Nostr 账号"
      >
        {newAccount && (
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                ⚠️ 重要提示
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                密钥就是账号。公钥类似用户名，私钥类似密码。
                <strong>私钥一旦丢失，账号将永久丢失！</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  公钥 (npub) - 可公开分享
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-purple-600 dark:text-purple-400 font-mono break-all border border-slate-200 dark:border-slate-700">
                    {newAccount.npub}
                  </code>
                  <CopyButton text={newAccount.npub} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  私钥 (nsec) - 请妥善保管，切勿分享！
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400 font-mono break-all border border-red-200 dark:border-red-800">
                    {newAccount.nsec}
                  </code>
                  <CopyButton text={newAccount.nsec} />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownloadKeys}
                className="px-4 py-2 flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="size-4" /> 下载密钥文件
              </button>
              <button
                onClick={handleConfirmAccount}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                我已保存，继续加入
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Quiz Modal */}
      <Modal isOpen={modal === "quiz"} onClose={closeModal} title="答题验证">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>公钥：</span>
            <code className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">
              {npubDisplay.slice(0, 16)}...{npubDisplay.slice(-8)}
            </code>
          </div>

          {quizSession && !quizResult && (
            <>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  为了防止该中继被垃圾账号攻击，需要你回答几道简单的中文知识题
                  ☺️
                  <br />
                  请回答以下问题加入社区。需要答对{" "}
                  {quizSession.config.passingScore} 道题。答题有效期{" "}
                  {quizSession.config.sessionTTLMinutes} 分钟。
                </p>
              </div>

              <div className="space-y-6">
                {quizSession.questions.map((q, qIndex) => (
                  <div key={qIndex} className="space-y-3">
                    <p className="font-medium text-slate-800 dark:text-white">
                      {qIndex + 1}. {q.question}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ">
                      {q.options.map((option, oIndex) => (
                        <label
                          key={oIndex}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            answers[qIndex] === oIndex
                              ? "bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${qIndex}`}
                            checked={answers[qIndex] === oIndex}
                            onChange={() => handleAnswerSelect(qIndex, oIndex)}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-slate-700 dark:text-slate-300">
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {quizError && <p className="text-sm text-red-500">{quizError}</p>}

              <button
                onClick={handleSubmitQuiz}
                disabled={loading || answers.some((a) => a === null)}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? "提交中..." : "提交答案"}
              </button>
            </>
          )}

          {quizResult && !quizResult.passed && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300 font-medium">
                  很遗憾，你只答对了 {quizResult.correctCount} 道题，未能通过。
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  不要灰心，再试一次吧。
                </p>
              </div>
              <button
                onClick={handleRetryQuiz}
                disabled={loading}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? "加载中..." : "重新答题"}
              </button>
            </div>
          )}

          {quizResult && quizResult.passed && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-300 font-medium">
                恭喜！你已通过答题验证，正在为你加入社区...
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={modal === "success"} onClose={handleComplete} title="🎊">
        <div className="space-y-4 text-center">
          <div className="p-6 bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
            <p className="text-2xl mb-2">🎊</p>
            <p className="text-lg font-semibold text-purple-700 dark:text-purple-300">
              欢迎加入 Nostr 中文社区！
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
              现在你可以向 NostrZH 社区 Relay 发帖了
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleComplete}
              className="px-6 py-2 w-full flex flex-col items-center bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                开始使用 <ExternalLink className="size-4" />
              </div>
            </button>
            <a
              href="/nip05"
              className="px-4 py-2 w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              注册 NIP-05
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
}
