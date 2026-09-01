import { templates } from "../templates";

export async function handleHelp(): Promise<string> {
  return templates.help();
}
