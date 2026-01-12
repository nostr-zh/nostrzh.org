/**
 * useAnimationFrame Hook
 * 管理动画帧的 React Hook
 */
import { useEffect, useRef } from "react";

/**
 * 使用 requestAnimationFrame 的 Hook
 * @param callback 每帧调用的回调函数
 * @param running 是否运行动画
 */
export function useAnimationFrame(callback: () => void, running: boolean = true) {
  const requestRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);

  // 更新 callback 引用
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!running) return;

    const animate = () => {
      callbackRef.current();
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [running]);
}
