import { useCallback, useEffect, useState } from 'react';
import type { ProjectFiles } from '../types/project';
import { listHistorySnapshots, saveHistorySnapshot } from '../storage/projectStore';

export const useVersionHistory = (projectId: string, files: ProjectFiles) => {
  const [entries, setEntries] = useState<Array<{ id: string; createdAt: number; files: ProjectFiles }>>([]);

  const refresh = useCallback(async () => {
    const snapshots = await listHistorySnapshots(projectId);
    setEntries(snapshots);
  }, [projectId]);

  const saveSnapshot = useCallback(async () => {
    await saveHistorySnapshot(projectId, files);
    await refresh();
  }, [files, projectId, refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { entries, saveSnapshot };
};
