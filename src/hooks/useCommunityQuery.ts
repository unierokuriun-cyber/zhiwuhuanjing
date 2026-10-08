import { useEffect, useRef, useState } from "react";
import { useCommunity } from "../store/community";
export function useCommunityQuery<T>(key: string, query: () => Promise<T>) {
  const revision = useCommunity((s) => s.revision);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    data?: T;
    loading: boolean;
    error: string;
  }>({ loading: true, error: "" });
  const activeKey = useRef(key);
  const queryRef = useRef(query);
  queryRef.current = query;
  useEffect(() => {
    let active = true;
    const changed = activeKey.current !== key;
    activeKey.current = key;
    setState((s) => ({
      data: changed ? undefined : s.data,
      loading: changed || s.data === undefined,
      error: "",
    }));
    queryRef
      .current()
      .then((data) => {
        if (active) setState({ data, loading: false, error: "" });
      })
      .catch((e) => {
        if (active)
          setState({
            loading: false,
            error: e instanceof Error ? e.message : "内容加载失败",
          });
      });
    return () => {
      active = false;
    };
  }, [key, revision, attempt]);
  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
