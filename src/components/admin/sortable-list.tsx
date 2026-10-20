"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

/** Rows are pre-rendered on the server (functions cannot cross the server/client boundary). */
export type SortableItem = { id: string; content: React.ReactNode };

function Row({
  id,
  index,
  total,
  children,
  disabled,
  onMove,
}: {
  id: string;
  index: number;
  total: number;
  children: React.ReactNode;
  disabled?: boolean;
  onMove: (index: number, direction: "up" | "down" | "top") => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-stretch surface-solid rounded-card border border-(--glass-line) transition-shadow overflow-hidden",
        isDragging && "z-20 border-accent shadow-2xl ring-2 ring-accent/30",
      )}
    >
      {!disabled ? (
        <div className="flex flex-col items-center justify-between border-r border-(--glass-line)/60 bg-fg/[0.02] px-1 py-1.5 select-none shrink-0 min-w-9">
          <div className="flex flex-col items-center gap-0.5">
            <button
              type="button"
              onClick={() => onMove(index, "up")}
              disabled={index === 0}
              aria-label={`Move item ${index + 1} up`}
              title={index === 0 ? "Already at the top" : "Move up"}
              className="grid size-6 place-items-center rounded text-subtle hover:bg-fg/[0.08] hover:text-fg disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronUp className="size-4" />
            </button>

            <button
              type="button"
              className="grid size-6 cursor-grab place-items-center rounded text-subtle hover:text-fg active:cursor-grabbing touch-none hover:bg-fg/[0.06] transition-colors"
              aria-label="Drag to reorder"
              title="Drag to reorder"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => onMove(index, "down")}
              disabled={index === total - 1}
              aria-label={`Move item ${index + 1} down`}
              title={index === total - 1 ? "Already at the bottom" : "Move down"}
              className="grid size-6 place-items-center rounded text-subtle hover:bg-fg/[0.08] hover:text-fg disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>

          <div className="flex flex-col items-center mt-1 border-t border-(--glass-line)/40 pt-1 w-full text-center">
            <span className="text-[0.625rem] font-mono font-bold text-subtle/80" title={`Position #${index + 1}`}>
              #{index + 1}
            </span>
            {index > 0 ? (
              <button
                type="button"
                onClick={() => onMove(index, "top")}
                aria-label={`Move item ${index + 1} to top`}
                title="Move directly to #1 (Top)"
                className="mt-0.5 text-[0.5625rem] font-semibold text-accent hover:underline uppercase tracking-tight"
              >
                Top
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex items-center px-2.5 border-r border-(--glass-line)/60 text-subtle font-mono text-xs select-none">
          #{index + 1}
        </div>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

/**
 * Drag-and-drop and button-controlled ordering persisted through a
 * server action that receives the full ordered id list. Optimistic UI.
 */
export function SortableList({
  items: initial,
  onReorder,
  disabled = false,
}: {
  items: SortableItem[];
  onReorder: (ids: string[]) => Promise<ActionResult>;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [prevInitial, setPrevInitial] = useState(initial);
  const [items, setItems] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setItems(initial);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const applyReorder = (next: SortableItem[], successMessage = "Order saved") => {
    const prev = items;
    setItems(next);
    start(async () => {
      const r = await onReorder(next.map((i) => i.id));
      if (r.ok) {
        toast.success(successMessage);
        router.refresh();
      } else {
        setItems(prev);
        toast.error(r.error);
      }
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIndex = items.findIndex((i) => i.id === e.active.id);
    const newIndex = items.findIndex((i) => i.id === e.over!.id);
    const next = arrayMove(items, oldIndex, newIndex);
    applyReorder(next);
  };

  const moveItem = (index: number, direction: "up" | "down" | "top") => {
    if (disabled) return;
    let targetIndex = index;
    if (direction === "up" && index > 0) targetIndex = index - 1;
    else if (direction === "down" && index < items.length - 1) targetIndex = index + 1;
    else if (direction === "top" && index > 0) targetIndex = 0;

    if (targetIndex === index) return;
    const next = arrayMove(items, index, targetIndex);
    applyReorder(next, direction === "top" ? "Moved to top (#1)" : "Order saved");
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2.5">
          {items.map((item, index) => (
            <Row
              key={item.id}
              id={item.id}
              index={index}
              total={items.length}
              disabled={disabled}
              onMove={moveItem}
            >
              {item.content}
            </Row>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
