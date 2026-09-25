import { Trash2 } from "lucide-react";

import { softDelete } from "@/server/actions/cms-common";

import { ActionButton } from "./confirm-action";

export function DeleteEntityButton({ entity, id, redirectTo, label }: { entity: string; id: string; redirectTo: string; label: string }) {
  return (
    <ActionButton
      variant="ghost"
      size="sm"
      redirectTo={redirectTo}
      action={async () => {
        "use server";
        return softDelete(entity, id);
      }}
      confirm={{ title: `Delete ${label}?`, description: `This removes the ${label} from the public site and the CMS.`, confirmLabel: "Delete" }}
    >
      <Trash2 /> Delete
    </ActionButton>
  );
}
