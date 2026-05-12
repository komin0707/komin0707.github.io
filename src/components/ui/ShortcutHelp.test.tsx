import { fireEvent, render, screen } from '@testing-library/react';
import { type RefObject } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ShortcutHelp } from './ShortcutHelp';

describe('ShortcutHelp', () => {
  registerShortcutHelpFocusTrapTest();
  registerShortcutHelpEmptyFocusablesTest();
  registerShortcutHelpSparseFocusablesTest();
  registerShortcutHelpNullActiveElementTest();
  registerShortcutHelpForwardTrapTest();
});

function registerShortcutHelpFocusTrapTest(): void {
  it('closes, traps tab focus, and restores fallback focus', () => {
    const fallbackButton = document.createElement('button');
    const fallbackFocusRef: RefObject<HTMLButtonElement> = { current: fallbackButton };
    const onClose = vi.fn();
    fallbackButton.textContent = 'Help';
    document.body.append(fallbackButton);

    const { unmount } = render(<ShortcutHelp fallbackFocusRef={fallbackFocusRef} onClose={onClose} />);
    const dialog = screen.getByRole('dialog', { name: '키보드 단축키 도움말' });
    const firstLink = screen.getByRole('link', { name: '본문 이동' });
    const closeButton = screen.getByRole('button', { name: '닫기' });

    expect(firstLink).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(firstLink).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(closeButton).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(firstLink).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    expect(fallbackButton).toHaveFocus();
    fallbackButton.remove();
  });
}

function registerShortcutHelpEmptyFocusablesTest(): void {
  it('ignores tab trapping when no focusable elements are found', () => {
    const fallbackFocusRef: RefObject<HTMLButtonElement | null> = { current: null };
    render(<ShortcutHelp fallbackFocusRef={fallbackFocusRef} onClose={() => undefined} />);
    const dialog = screen.getByRole('dialog', { name: '키보드 단축키 도움말' });
    const querySelectorAll = vi
      .spyOn(dialog, 'querySelectorAll')
      .mockReturnValue([] as unknown as NodeListOf<Element>);

    fireEvent.keyDown(dialog, { key: 'Tab' });

    expect(querySelectorAll).toHaveBeenCalled();
    querySelectorAll.mockRestore();
  });
}

function registerShortcutHelpSparseFocusablesTest(): void {
  it('ignores malformed focusable query results', () => {
    const fallbackFocusRef: RefObject<HTMLButtonElement | null> = { current: null };
    render(<ShortcutHelp fallbackFocusRef={fallbackFocusRef} onClose={() => undefined} />);
    const dialog = screen.getByRole('dialog', { name: '키보드 단축키 도움말' });
    const querySelectorAll = vi
      .spyOn(dialog, 'querySelectorAll')
      .mockReturnValue({ length: 1 } as unknown as NodeListOf<Element>);

    fireEvent.keyDown(dialog, { key: 'Tab' });

    expect(querySelectorAll).toHaveBeenCalled();
    querySelectorAll.mockRestore();
  });
}

function registerShortcutHelpNullActiveElementTest(): void {
  it('handles a missing active element while setting initial focus', () => {
    const fallbackFocusRef: RefObject<HTMLButtonElement | null> = { current: null };
    Object.defineProperty(document, 'activeElement', { configurable: true, get: () => null });

    try {
      render(<ShortcutHelp fallbackFocusRef={fallbackFocusRef} onClose={() => undefined} />).unmount();
    } finally {
      Reflect.deleteProperty(document, 'activeElement');
    }
  });
}

function registerShortcutHelpForwardTrapTest(): void {
  it('moves forward from the last focusable element', () => {
    const fallbackFocusRef: RefObject<HTMLButtonElement | null> = { current: null };
    render(<ShortcutHelp fallbackFocusRef={fallbackFocusRef} onClose={() => undefined} />);
    const dialog = screen.getByRole('dialog', { name: '키보드 단축키 도움말' });
    const firstLink = screen.getByRole('link', { name: '본문 이동' });
    const closeButton = screen.getByRole('button', { name: '닫기' });

    closeButton.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });

    expect(firstLink).toHaveFocus();
  });
}
