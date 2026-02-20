import { openDB } from 'idb';
import type { Project } from '../types/project';

const DB_NAME = 'dml-editor';

const db = openDB(DB_NAME, 1, {
  upgrade(database) {
    database.createObjectStore('projects', { keyPath: 'id' });
    database.createObjectStore('history', { keyPath: 'id' });
  },
});

export const saveProject = async (project: Project): Promise<void> => {
  (await db).put('projects', project);
};

export const loadProject = async (id: string): Promise<Project | undefined> => (await db).get('projects', id);

export const listProjects = async (): Promise<Project[]> => (await db).getAll('projects');

export const deleteProject = async (id: string): Promise<void> => {
  (await db).delete('projects', id);
};

export const saveHistorySnapshot = async (id: string, files: Project['files']): Promise<void> => {
  (await db).put('history', { id: `${id}:${Date.now()}`, projectId: id, files, createdAt: Date.now() });
};

export const listHistorySnapshots = async (
  projectId: string,
): Promise<Array<{ id: string; files: Project['files']; createdAt: number }>> => {
  const all = await (await db).getAll('history');
  return all.filter((entry) => entry.projectId === projectId).sort((a, b) => b.createdAt - a.createdAt);
};
