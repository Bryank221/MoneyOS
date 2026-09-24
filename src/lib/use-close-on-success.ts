import { useState } from "react";

/**
 * Closes a dialog the render after a form action reports success, without a
 * setState-in-effect (React docs: adjust state during render, not in an
 * effect, when reacting to a prop/state change).
 */
export function useCloseOnSuccess(success: boolean | undefined, setOpen: (open: boolean) => void) {
  const [prevSuccess, setPrevSuccess] = useState(success);
  if (success !== prevSuccess) {
    setPrevSuccess(success);
    if (success) setOpen(false);
  }
}
