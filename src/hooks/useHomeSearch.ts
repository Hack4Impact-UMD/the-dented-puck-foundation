import { useCallback, useEffect, useState } from 'react';
import { homeErrorMessage, useHomeDashboard } from '@/hooks/useHomeDashboard';
import type { HomeDataSource, HomeSearchCatalog, HomeViewer } from '@/types/home';

interface SearchState {
  viewer: HomeViewer;
  source: HomeDataSource;
  since: Date;
  revision: number;
  catalog: HomeSearchCatalog | null;
  error: string | null;
}

export function useHomeSearch(enabled = true) {
  const { state, source, isCurrentViewer } = useHomeDashboard();
  const { viewer, since, phase } = state;
  const [result, setResult] = useState<SearchState | null>(null);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    const readCatalog = source.searchCatalog;
    if (!enabled || phase !== 'ready' || !viewer || !readCatalog) return;
    const current = () => active && isCurrentViewer(viewer.uid);
    // An adapter can throw before returning its Promise (for example its
    // sandbox guard). Catch that as well as rejected asynchronous reads.
    void (async () => {
      try {
        const catalog = await readCatalog(viewer, since);
        if (current()) setResult({ viewer, source, since, revision, catalog, error: null });
      } catch (error) {
        if (current()) setResult({ viewer, source, since, revision, catalog: null, error: homeErrorMessage(error) });
      }
    })();
    return () => { active = false; };
  }, [enabled, phase, viewer, since, source, isCurrentViewer, revision]);

  // Never show the old account/location's rows while its replacement loads.
  const current = enabled && phase === 'ready' && viewer && isCurrentViewer(viewer.uid) && result?.viewer === viewer && result.source === source && result.since === since && result.revision === revision ? result : null;
  return {
    catalog: current?.catalog ?? null,
    error: current?.error ?? null,
    loading: enabled && phase === 'ready' && !!source.searchCatalog && !current,
    available: !!source.searchCatalog,
    reload,
  };
}
