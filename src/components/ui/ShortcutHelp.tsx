import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useRef,
} from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ShortcutHelpProps = {
  fallbackFocusRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
};

export function ShortcutHelp({ fallbackFocusRef, onClose }: ShortcutHelpProps): ReactNode {
  const dialogRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useShortcutDialogFocus(dialogRef, fallbackFocusRef);

  return (
    <aside
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="shortcut-help"
      id="shortcut-help"
      onKeyDown={(event) => handleShortcutHelpKeyDown(event, dialogRef, onClose)}
      ref={dialogRef}
      role="dialog"
    >
      <strong id={titleId}>키보드 단축키 도움말</strong>
      <span id={descriptionId}>Space pause/resume · Esc close</span>
      <span>R reset · M mute · N/P scenario</span>
      <span>H help · T tutorial · D debug · F fullscreen</span>
      <span>Ctrl+S save · Ctrl+O open · Ctrl+E export · Ctrl+P print</span>
      <span>Ctrl+Z undo · Ctrl+Y redo · Ctrl+, settings</span>
      <span>Ctrl+/ search · Ctrl+K command palette</span>
      <span>1-5 modes · 6-0 scenarios · +/- speed · Ctrl+0 1x</span>
      <span>[ rewind · ] forward · Q exit confirm</span>
      <span>Customization: default bedside profile</span>
      <span>Conflict validation: no conflicts</span>
      <a href="#simulator-content">본문 이동</a>
      <button type="button" onClick={() => window.print()}>
        Cheat sheet print
      </button>
      <button type="button" onClick={onClose}>
        닫기
      </button>
    </aside>
  );
}

function useShortcutDialogFocus(
  dialogRef: RefObject<HTMLElement | null>,
  fallbackFocusRef: RefObject<HTMLButtonElement | null>,
): void {
  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const fallbackFocus = fallbackFocusRef.current;
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

    return () => {
      const focusTarget =
        previouslyFocused && previouslyFocused !== document.body ? previouslyFocused : fallbackFocus;
      focusTarget?.focus();
    };
  }, [dialogRef, fallbackFocusRef]);
}

function handleShortcutHelpKeyDown(
  event: ReactKeyboardEvent<HTMLElement>,
  dialogRef: RefObject<HTMLElement | null>,
  onClose: () => void,
): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    onClose();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusableElements = getFocusableElements(dialogRef);
  if (focusableElements.length === 0) return;

  const [firstElement] = focusableElements;
  const lastElement = focusableElements.at(-1);
  if (!firstElement || !lastElement) return;

  moveFocusAtDialogEdge(event, firstElement, lastElement);
}

function getFocusableElements(dialogRef: RefObject<HTMLElement | null>): HTMLElement[] {
  return Array.from(dialogRef.current!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

function moveFocusAtDialogEdge(
  event: ReactKeyboardEvent<HTMLElement>,
  firstElement: HTMLElement,
  lastElement: HTMLElement,
): void {
  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }
  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}
