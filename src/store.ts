import { LocalStorage } from "@raycast/api";

export type Slot = "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "laptop";

export const SLOTS: { key: Slot; title: string }[] = [
  { key: "topLeft", title: "Monitor – Top Left" },
  { key: "topRight", title: "Monitor – Top Right" },
  { key: "bottomLeft", title: "Monitor – Bottom Left" },
  { key: "bottomRight", title: "Monitor – Bottom Right" },
  { key: "laptop", title: "Laptop – Full Screen" },
];

export type SlotApps = Partial<Record<Slot, string>>;

export interface Workspace {
  id: string;
  name: string;
  apps: SlotApps;
}

const KEY = "workspaces";

export async function loadWorkspaces(): Promise<Workspace[]> {
  const raw = await LocalStorage.getItem<string>(KEY);
  return raw ? JSON.parse(raw) : [];
}

async function store(workspaces: Workspace[]) {
  await LocalStorage.setItem(KEY, JSON.stringify(workspaces));
}

export async function saveWorkspace(workspace: Workspace) {
  const all = await loadWorkspaces();
  const index = all.findIndex((w) => w.id === workspace.id);
  if (index >= 0) all[index] = workspace;
  else all.push(workspace);
  await store(all);
}

export async function deleteWorkspace(id: string) {
  await store((await loadWorkspaces()).filter((w) => w.id !== id));
}

export async function findWorkspace(query: string): Promise<Workspace | undefined> {
  const q = query.trim().toLowerCase();
  const all = await loadWorkspaces();
  return (
    all.find((w) => w.name.toLowerCase() === q) ??
    all.find((w) => w.name.toLowerCase().startsWith(q)) ??
    all.find((w) => w.name.toLowerCase().includes(q))
  );
}

export function appName(path: string) {
  return path.split("/").pop()?.replace(/\.app$/, "") ?? path;
}
