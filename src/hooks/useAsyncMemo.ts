// useAsyncMemo
import { useEffect, useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useAsyncMemo = <T>(factory: () => Promise<T>, deps: any[]) => {
  const [value, setValue] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    factory()
      .then(v => {
        if (cancelled) return;
        setValue(v);
      })
      .catch(error_ => {
        if (cancelled) return;
        setError(error_);
      });

    return () => {
      cancelled = true;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return [value, error] as const;
};
