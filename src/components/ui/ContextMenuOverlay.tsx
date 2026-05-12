import type { ReactNode } from 'react';

export type ContextMenuState = {
  x: number;
  y: number;
};

type ContextMenuOverlayProps = {
  contextMenu: ContextMenuState;
  isPaused: boolean;
  onClose: () => void;
  onPauseToggle: () => void;
  onReset: () => void;
};

export function ContextMenuOverlay({
  contextMenu,
  isPaused,
  onClose,
  onPauseToggle,
  onReset,
}: ContextMenuOverlayProps): ReactNode {
  const copyContext = () => {
    void navigator.clipboard?.writeText('VENT SIMULATOR 2D context snapshot');
    onClose();
  };
  const saveContext = () => {
    if (typeof URL.createObjectURL === 'function') {
      const link = document.createElement('a');
      link.download = 'vent-context.json';
      link.href = URL.createObjectURL(
        new Blob([JSON.stringify({ paused: isPaused }, null, 2)], { type: 'application/json' }),
      );
      link.click();
      URL.revokeObjectURL(link.href);
    }
    onClose();
  };
  const shareContext = () => {
    void navigator.share?.({ text: 'VENT SIMULATOR 2D context snapshot', title: 'VENT SIMULATOR 2D' });
    onClose();
  };

  return (
    <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} role="menu">
      <button type="button" role="menuitem" onClick={onClose}>
        Analyze
      </button>
      <button type="button" onClick={onPauseToggle}>
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      <button type="button" onClick={onReset}>
        Reset
      </button>
      <button type="button" role="menuitem" onClick={copyContext}>
        Copy
      </button>
      <button type="button" role="menuitem" onClick={saveContext}>
        Save
      </button>
      <button type="button" role="menuitem" onClick={() => window.print()}>
        Print
      </button>
      <button type="button" role="menuitem" onClick={shareContext}>
        Share
      </button>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
