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
        setError(err.message);
        setLoading(false);
      });
  }, [limit]);

  return { users, loading, error };
}
