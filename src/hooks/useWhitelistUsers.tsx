import { useEffect, useState } from "react";
import { BACKEND_SERVER_URL } from "../constants";

export function useWhitelistUsers(limit?: number) {
  const [users, setUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND_SERVER_URL}/v1/users`)
      .then((res) => res.json())
      .then((data: string[]) => {
        setUsers(limit ? data.slice(0, limit) : data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch whitelist users:", err);
        setError(err.message);
        setLoading(false);
        // 使用默认用户列表作为 fallback
        setUsers([]);
      });
  }, []); // 移除 limit 依赖，避免无限循环

  return { users, loading, error };
}
