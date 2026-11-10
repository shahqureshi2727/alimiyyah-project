import { useEffect, useState } from 'react';
import { loadBank } from '../lib/quiz-banks';
import { error as logError } from '../lib/logger';

export function useAsyncQuestionBank({ mode, topic, loader = loadBank }) {
  const [bank, setBank] = useState([]);
  const [loading, setLoading] = useState(Boolean(mode));
  const [loadError, setLoadError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!mode) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setBank([]);
        setLoading(false);
        setLoadError(null);
      });
      return undefined;
    }

    Promise.resolve()
      .then(() => {
        if (cancelled) return [];
        setLoading(true);
        setLoadError(null);
        return loader(mode, topic);
      })
      .then((questions) => {
        if (cancelled) return;
        setBank(questions);
      })
      .catch((err) => {
        if (cancelled) return;
        logError('Could not load question bank.', err, { mode, topic });
        setBank([]);
        setLoadError("Couldn't load questions. Retry.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loader, mode, retryKey, topic]);

  return {
    bank,
    loading,
    loadError,
    retryLoad: () => setRetryKey((key) => key + 1),
  };
}
