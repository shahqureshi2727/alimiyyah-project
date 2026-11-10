import { useEffect, useState } from 'react';

export default function Bootstrap() {
  const [LoadedApp, setLoadedApp] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    import('./RootApp.jsx')
      .then((module) => {
        if (!cancelled) setLoadedApp(() => module.default);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) throw loadError;
  if (!LoadedApp) return <div className="loading-screen">Loading...</div>;

  return <LoadedApp />;
}
