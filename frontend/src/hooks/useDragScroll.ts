import { useRef } from "react";
import type { MouseEvent } from "react";

const INTERACTIVE_SELECTOR =
  "a,button,input,textarea,select,[role='button'],.ant-table-column-sorters";

export function useDragScroll() {
  const draggingRef = useRef(false);
  const scrollElementRef = useRef<HTMLElement | null>(null);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);

  function stopDragging() {
    draggingRef.current = false;

    if (scrollElementRef.current) {
      scrollElementRef.current.classList.remove("is-dragging");
    }

    scrollElementRef.current = null;
  }

  return {
    onMouseDown: (event: MouseEvent<HTMLElement>) => {
      if (event.button !== 0) return;

      const target = event.target as HTMLElement;

      if (target.closest(INTERACTIVE_SELECTOR)) return;

      const wrapper = event.currentTarget;
      const scrollElement = wrapper.querySelector<HTMLElement>(
        ".ant-table-body, .ant-table-content"
      );

      if (!scrollElement || scrollElement.scrollWidth <= scrollElement.clientWidth) {
        return;
      }

      draggingRef.current = true;
      scrollElementRef.current = scrollElement;
      startXRef.current = event.clientX;
      startScrollLeftRef.current = scrollElement.scrollLeft;
      scrollElement.classList.add("is-dragging");
      event.preventDefault();
    },
    onMouseMove: (event: MouseEvent<HTMLElement>) => {
      if (!draggingRef.current || !scrollElementRef.current) return;

      const deltaX = event.clientX - startXRef.current;
      scrollElementRef.current.scrollLeft = startScrollLeftRef.current - deltaX;
    },
    onMouseLeave: stopDragging,
    onMouseUp: stopDragging,
  };
}
