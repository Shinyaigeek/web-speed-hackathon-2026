import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { SSRDataContext } from "@web-speed-hackathon-2026/client/src/contexts/SSRDataContext";

const LIMIT = 30;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  hasMore: boolean;
  isLoading: boolean;
  fetchMore: () => void;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
): ReturnValues<T> {
  const ssrData = useContext(SSRDataContext);
  const ssrValue = ssrData?.[apiPath] as T[] | undefined;
  const skipRef = useRef(ssrValue !== undefined);

  const internalRef = useRef({
    hasMore: ssrValue !== undefined ? ssrValue.length >= LIMIT : true,
    isLoading: false,
    offset: ssrValue !== undefined ? ssrValue.length : 0,
  });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: ssrValue !== undefined ? ssrValue : [],
    error: null,
    hasMore: ssrValue !== undefined ? ssrValue.length >= LIMIT : true,
    isLoading: ssrValue !== undefined ? false : true,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, offset, hasMore } = internalRef.current;
    if (isLoading || !hasMore) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      ...internalRef.current,
      isLoading: true,
    };

    const separator = apiPath.includes("?") ? "&" : "?";
    const paginatedPath = `${apiPath}${separator}limit=${LIMIT}&offset=${offset}`;

    void fetcher(paginatedPath).then(
      (pageData) => {
        const newHasMore = pageData.length >= LIMIT;
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          hasMore: newHasMore,
          isLoading: false,
        }));
        internalRef.current = {
          hasMore: newHasMore,
          isLoading: false,
          offset: offset + pageData.length,
        };
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
          ...internalRef.current,
          isLoading: false,
        };
      },
    );
  }, [apiPath, fetcher]);

  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }

    setResult(() => ({
      data: [],
      error: null,
      hasMore: true,
      isLoading: true,
    }));
    internalRef.current = {
      hasMore: true,
      isLoading: false,
      offset: 0,
    };

    fetchMore();
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
