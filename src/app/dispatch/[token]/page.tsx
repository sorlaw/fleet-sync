import { getDispatchState } from "@/lib/dispatch";
import DispatchBlocked from "@/app/dispatch/components/DispatchBlocked";
import DispatchStartForm from "./DispatchStartForm";

export default async function DispatchStartPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const state = await getDispatchState(token, "start");

  if (!state.ok) {
    return <DispatchBlocked reason={state.reason} type="start" />;
  }

  return <DispatchStartForm token={token} />;
}
