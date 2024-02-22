import { useEffect, useRef } from 'react';

const useInterval = (callback: any, delay: any) => {
  const savedCallback = useRef<any>(null); // Use `any` type for savedCallback

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(():any => {
    let id: number | undefined;

    const handler = () => {
      savedCallback.current();
      // Accumulate other state updates here if needed
    };

    if (delay !== null) {
      id = setInterval(handler, delay);
    }

    return () => id !== undefined && clearInterval(id); // Check if id is defined before clearing interval
  }, [delay]);
};

export default useInterval;