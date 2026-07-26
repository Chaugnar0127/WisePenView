import { useMemo, type DependencyList } from 'react';

/**
 * 受控的 useMemo 入口。
 * 原生 hook 只在此处集中放行；调用方必须证明缓存有实际收益，而不是把它当作默认写法。
 */
export function useMemoForce<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo -- 统一出口接收调用方显式依赖，规则无法静态分析非字面量依赖。
  return useMemo(factory, deps);
}
