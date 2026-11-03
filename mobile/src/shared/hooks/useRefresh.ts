import { useCallback, useState } from 'react';

/** Pull-to-refresh helper for one or many react-query refetch functions. */
export function useRefresh(...fns: (() => Promise<unknown>)[]) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all(fns.map((f) => f()));
    } finally {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, fns);
  return { refreshing, onRefresh };
}
