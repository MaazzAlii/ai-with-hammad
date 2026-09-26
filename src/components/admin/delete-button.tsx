import { Trash2 } from "lucide-react";

import { softDelete } from "@/server/actions/cms-common";

import { ActionButton } from "./confirm-action";

/**
 * Confirmed delete for any registered CMS entity. Without `redirectTo` the current page
 * refreshes (list rows); with it the user is sent back to the list (detail pages).
 */
export function DeleteEntityButton({ entity, id, redirectTo, label, iconOnly = false }: { entity: string; id: string; redirectTo?: string; label: string; iconOnly?: boolean }) {
  return (
    <ActionButton
      variant="ghost"
      size={iconOnly ? "icon" : "sm"}
      redirectTo={redirectTo}
      className={iconOnly ? "size-9 text-muted hover:bg-danger-soft hover:text-danger" : "hover:bg-danger-soft hover:text-danger"}
      aria-label={iconOnly ? `Delete ${label}` : undefined}
      title={iconOnly ? `Delete ${label}` : undefined}
      action={async () => {
        "use server";
        return softDelete(entity, id);
      }}
      confirm={{ title: `Delete ${label}?`, description: `This removes the ${label} from the public site and the CMS.`, confirmLabel: "Delete" }}
    >
      <Trash2 />
      {iconOnly ? null : " Delete"}
    </ActionButton>
  );
}
