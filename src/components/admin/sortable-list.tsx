"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

type Item = { id: string };

function Row({ id, children, disabled }: { id: string; children: React.ReactNode; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("flex items-stretch rounded-card border border-border bg-surface", isDragging && "z-10 border-accent shadow-2xl")}>
      {!disabled ? (
        <button type="button" className="flex cursor-grab items-center px-2 text-subtle hover:text-fg active:cursor-grabbing" aria-label="Drag to reorder (or focus and use arrow keys)" {...attributes} {...listeners}>
          <GripVertical className="size-4" />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

/**
 * Drag-and-drop (mouse, touch and keyboard) ordering persisted through a
 * server action that receives the full ordered id list. Optimistic UI.
 */
export function SortableList<T extends Item>({
  items: initial,
  onReorder,
  render,
  disabled = false,
}: {
  items: T[];
  onReorder: (ids: string[]) => Promise<ActionResult>;
  render: (item: T) => React.ReactNode;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [, start] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const prev = items;
    const next = arrayMove(items, items.findIndex((i) => i.id === e.active.id), items.findIndex((i) => i.id === e.over!.id));
    setItems(next);
    start(async () => {
      const r = await onReorder(next.map((i) => i.id));
      if (r.ok) {
        toast.success("Order saved");
        router.refresh();
      } else {
        setItems(prev);
        toast.error(r.error);
      }
    });
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((item) => (
            <Row key={item.id} id={item.id} disabled={disabled}>
              {render(item)}
            </Row>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
