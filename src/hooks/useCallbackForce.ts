import { useCallback, type DependencyList } from 'react';

/**
 * 受控的 useCallback 入口。
 * 原生 hook 只在此处集中放行；调用方必须证明函数引用稳定会带来实际收益。
 */
export function useCallbackForce<T extends (...args: never[]) => unknown>(
  callback: T,
  deps: DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo -- 统一出口接收调用方显式依赖，规则无法静态分析非字面量依赖。
  return useCallback(callback, deps);
}
