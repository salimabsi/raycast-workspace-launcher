import { launchCommand, LaunchType } from "@raycast/api";
import { SlotApps } from "./store";

// Arranging takes several seconds; a no-view command keeps running after Raycast's window closes.
export function launchArrange(apps: SlotApps, label: string) {
  return launchCommand({
    name: "open-workspace",
    type: LaunchType.UserInitiated,
    arguments: { name: label },
    context: { apps, label },
  });
}
