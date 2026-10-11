import { closeMainWindow, LaunchProps, showHUD } from "@raycast/api";
import { arrange } from "./arrange";
import { findWorkspace, SlotApps } from "./store";

type Props = LaunchProps<{
  arguments: { name: string };
  launchContext?: { apps: SlotApps; label: string };
}>;

export default async function Command({ arguments: args, launchContext }: Props) {
  let apps = launchContext?.apps;
  let label = launchContext?.label;

  if (!apps) {
    const workspace = await findWorkspace(args.name);
    if (!workspace) {
      await showHUD(`No workspace named “${args.name}”`);
      return;
    }
    apps = workspace.apps;
    label = workspace.name;
  }

  await closeMainWindow();
  const failures = await arrange(apps);
  await showHUD(failures.length ? `Could not place ${failures.join("; ")}` : `Opened ${label}`);
}
