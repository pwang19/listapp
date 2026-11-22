import { useEffect } from 'react';

/**
 * Calls onClose when the user presses Escape or mouses down outside every
 * element in `refs` (e.g. the popover and the button that toggles it).
 */
export default function useDismissable(active, refs, onClose) {
  useEffect(() => {
    if (!active) return undefined;
    const handleMouseDown = (event) => {
      if (refs.some((ref) => ref?.current?.contains(event.target))) return;
      onClose();
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
    // refs are stable ref objects, read at event time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, onClose]);
}
