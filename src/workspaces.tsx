import { Action, ActionPanel, Alert, confirmAlert, Icon, Keyboard, List } from "@raycast/api";
import { createDeeplink, usePromise } from "@raycast/utils";
import { launchArrange } from "./launch";
import { WorkspaceForm } from "./new-workspace";
import { appName, deleteWorkspace, loadWorkspaces, SLOTS, Workspace } from "./store";

export default function Command() {
  const { data, isLoading, revalidate } = usePromise(loadWorkspaces);

  const newAction = (
    <Action.Push
      title="New Workspace"
      icon={Icon.Plus}
      shortcut={Keyboard.Shortcut.Common.New}
      target={<WorkspaceForm onSaved={revalidate} />}
    />
  );

  async function remove(workspace: Workspace) {
    const confirmed = await confirmAlert({
      title: `Delete “${workspace.name}”?`,
      primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) return;
    await deleteWorkspace(workspace.id);
    revalidate();
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search workspaces">
      <List.EmptyView
        title="No saved workspaces"
        description="Press Enter to create one"
        actions={<ActionPanel>{newAction}</ActionPanel>}
      />
      {data?.map((workspace) => (
        <List.Item
          key={workspace.id}
          title={workspace.name}
          icon={Icon.AppWindowGrid2x2}
          subtitle={SLOTS.filter(({ key }) => key !== "laptop" && workspace.apps[key])
            .map(({ key }) => appName(workspace.apps[key]!))
            .join(" · ")}
          accessories={
            workspace.apps.laptop ? [{ icon: Icon.Monitor, text: appName(workspace.apps.laptop) }] : undefined
          }
          actions={
            <ActionPanel>
              <Action
                title="Open Workspace"
                icon={Icon.AppWindowGrid2x2}
                onAction={() => launchArrange(workspace.apps, workspace.name)}
              />
              <Action.Push
                title="Edit Workspace"
                icon={Icon.Pencil}
                shortcut={Keyboard.Shortcut.Common.Edit}
                target={<WorkspaceForm workspace={workspace} onSaved={revalidate} />}
              />
              <Action.CreateQuicklink
                title="Add as Raycast Command"
                quicklink={{
                  name: workspace.name,
                  link: createDeeplink({ command: "open-workspace", arguments: { name: workspace.name } }),
                }}
              />
              {newAction}
              <Action
                title="Delete Workspace"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={Keyboard.Shortcut.Common.Remove}
                onAction={() => remove(workspace)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
