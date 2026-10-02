import { getDispatchState } from "@/lib/dispatch";
import DispatchBlocked from "@/app/dispatch/components/DispatchBlocked";
import DispatchReturnForm from "./DispatchReturnForm";

export default async function DispatchReturnPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const state = await getDispatchState(token, "return");

  if (!state.ok) {
    return <DispatchBlocked reason={state.reason} type="return" />;
  }

  return <DispatchReturnForm token={token} />;
}
