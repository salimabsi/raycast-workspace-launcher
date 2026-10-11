import { Action, ActionPanel, Form, getApplications, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { randomUUID } from "crypto";
import { launchArrange } from "./launch";
import { loadWorkspaces, saveWorkspace, SLOTS, SlotApps, Workspace } from "./store";

const NONE = "none";

type Values = Record<string, string>;

export function WorkspaceForm({ workspace, onSaved }: { workspace?: Workspace; onSaved?: () => void }) {
  const { pop } = useNavigation();
  const { data: apps, isLoading } = usePromise(async () =>
    (await getApplications()).sort((a, b) => a.name.localeCompare(b.name)),
  );

  function slotApps(values: Values): SlotApps | undefined {
    const chosen: SlotApps = {};
    for (const { key } of SLOTS) {
      if (values[key] && values[key] !== NONE) chosen[key] = values[key];
    }
    if (Object.keys(chosen).length) return chosen;
    showToast({ style: Toast.Style.Failure, title: "Pick at least one app" });
  }

  async function save(values: Values, chosen: SlotApps) {
    const name = values.name.trim();
    const existing = workspace ?? (await loadWorkspaces()).find((w) => w.name.toLowerCase() === name.toLowerCase());
    await saveWorkspace({ id: existing?.id ?? randomUUID(), name, apps: chosen });
    onSaved?.();
  }

  async function open(values: Values) {
    const chosen = slotApps(values);
    if (!chosen) return;
    const name = values.name.trim();
    if (name) await save(values, chosen);
    await launchArrange(chosen, name || "windows");
  }

  async function saveOnly(values: Values) {
    const chosen = slotApps(values);
    if (!chosen) return;
    if (!values.name.trim()) {
      showToast({ style: Toast.Style.Failure, title: "Give the workspace a name" });
      return;
    }
    await save(values, chosen);
    await showToast({ title: `Saved “${values.name.trim()}”` });
    if (workspace || onSaved) pop();
  }

  const openAction = <Action.SubmitForm title="Open Windows" icon={Icon.AppWindowGrid2x2} onSubmit={open} />;
  const saveAction = <Action.SubmitForm title="Save Workspace" icon={Icon.SaveDocument} onSubmit={saveOnly} />;

  return (
    <Form
      isLoading={isLoading}
      navigationTitle={workspace ? `Edit ${workspace.name}` : "Arrange Windows"}
      actions={
        <ActionPanel>
          {workspace ? saveAction : openAction}
          {workspace ? openAction : saveAction}
        </ActionPanel>
      }
    >
      {SLOTS.map(({ key, title }) => (
        <Form.Dropdown key={key} id={key} title={title} defaultValue={workspace?.apps[key] ?? NONE}>
          <Form.Dropdown.Item value={NONE} title="None" icon={Icon.Minus} />
          {apps?.map((app) => (
            <Form.Dropdown.Item key={app.path} value={app.path} title={app.name} icon={{ fileIcon: app.path }} />
          ))}
        </Form.Dropdown>
      ))}
      <Form.Separator />
      <Form.TextField
        id="name"
        title="Save As"
        placeholder="e.g. Coding — leave empty to just open"
        defaultValue={workspace?.name}
      />
    </Form>
  );
}

export default function Command() {
  return <WorkspaceForm />;
}
