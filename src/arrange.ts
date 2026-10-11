import { execFile } from "child_process";
import { promisify } from "util";
import { appName, SLOTS, SlotApps } from "./store";

const exec = promisify(execFile);

// System Events uses a top-left origin on the primary screen; NSScreen uses bottom-left.
const PLACE_WINDOW = `
ObjC.import("AppKit");

function waitFor(check, seconds) {
  for (let i = 0; i < seconds * 10; i++) {
    const value = check();
    if (value) return value;
    delay(0.1);
  }
  return null;
}

function run(argv) {
  const [path, slot, newWindow] = argv;
  const bundleId = $.NSBundle.bundleWithPath(path).bundleIdentifier.js;

  const screens = $.NSScreen.screens.js;
  const primaryHeight = screens[0].frame.size.height;
  let laptop = screens.findIndex((s) => s.localizedName.js.includes("Built-in"));
  if (laptop < 0) laptop = 0;
  let monitor = screens.findIndex((_, i) => i !== laptop);
  if (monitor < 0) monitor = laptop;

  const frame = screens[slot === "laptop" ? laptop : monitor].visibleFrame;
  const x = frame.origin.x;
  const y = primaryHeight - frame.origin.y - frame.size.height;
  const w = frame.size.width;
  const h = frame.size.height;
  const hw = Math.floor(w / 2);
  const hh = Math.floor(h / 2);
  const rects = {
    topLeft: [x, y, hw, hh],
    topRight: [x + hw, y, w - hw, hh],
    bottomLeft: [x, y + hh, hw, h - hh],
    bottomRight: [x + hw, y + hh, w - hw, h - hh],
    laptop: [x, y, w, h],
  };

  const events = Application("System Events");
  Application(bundleId).activate();
  const proc = waitFor(() => {
    const found = events.processes.whose({ bundleIdentifier: bundleId });
    return found.length ? found[0] : null;
  }, 10);
  if (!proc) throw new Error("app did not start");
  waitFor(() => proc.frontmost(), 5);

  if (newWindow === "1") {
    const before = proc.windows.length;
    events.keystroke("n", { using: "command down" });
    waitFor(() => proc.windows.length > before, 5);
  }
  if (!waitFor(() => proc.windows.length > 0, 10)) throw new Error("no window appeared");

  const win = proc.windows[0];
  const [left, top, width, height] = rects[slot];
  win.position = [left, top];
  win.size = [width, height];
  // Moving across displays can clamp the size, so set position again after resizing.
  win.position = [left, top];
}
`;

export async function arrange(apps: SlotApps): Promise<string[]> {
  const failures: string[] = [];
  const placed = new Set<string>();

  for (const { key } of SLOTS) {
    const path = apps[key];
    if (!path) continue;
    try {
      await exec("open", ["-a", path]);
      await exec("osascript", ["-l", "JavaScript", "-e", PLACE_WINDOW, path, key, placed.has(path) ? "1" : "0"], {
        timeout: 30_000,
      });
      placed.add(path);
    } catch (error) {
      const message = error instanceof Error ? error.message.trim().split("\n").pop() : String(error);
      failures.push(`${appName(path)}: ${message}`);
    }
  }
  return failures;
}
