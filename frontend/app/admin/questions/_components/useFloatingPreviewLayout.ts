'use client';

import { useCallback, useEffect, useState } from 'react';

const DESKTOP_PREVIEW_BREAKPOINT = 1280;
const FLOATING_PREVIEW_TOP = 96;

type DesktopPreviewLayout =
  | { mode: 'static' }
  | { mode: 'fixed'; left: number; width: number }
  | { mode: 'absolute'; top: number };

function isSameDesktopPreviewLayout(
  current: DesktopPreviewLayout,
  next: DesktopPreviewLayout
) {
  if (current.mode !== next.mode) {
    return false;
  }

  if (current.mode === 'fixed' && next.mode === 'fixed') {
    return current.left === next.left && current.width === next.width;
  }

  if (current.mode === 'absolute' && next.mode === 'absolute') {
    return current.top === next.top;
  }

  return true;
}

export function useFloatingPreviewLayout(isEnabled: boolean) {
  const [desktopPreviewLayout, setDesktopPreviewLayout] = useState<DesktopPreviewLayout>({
    mode: 'static',
  });
  const [cardHeight, setCardHeight] = useState(0);
  const [rowElement, setRowElement] = useState<HTMLDivElement | null>(null);
  const [railElement, setRailElement] = useState<HTMLElement | null>(null);
  const [cardElement, setCardElement] = useState<HTMLDivElement | null>(null);

  const rowRef = useCallback((node: HTMLDivElement | null) => {
    setRowElement(node);
  }, []);

  const railRef = useCallback((node: HTMLElement | null) => {
    setRailElement(node);
  }, []);

  const cardRef = useCallback((node: HTMLDivElement | null) => {
    setCardElement(node);
    setCardHeight(node?.offsetHeight ?? 0);
  }, []);

  useEffect(() => {
    if (!cardElement || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const nextHeight = entries[0]?.contentRect.height ?? 0;
      setCardHeight((current) => (current === nextHeight ? current : nextHeight));
    });

    observer.observe(cardElement);

    return () => observer.disconnect();
  }, [cardElement]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    let frameId = 0;

    const updateDesktopPreviewLayout = () => {
      if (
        typeof window === 'undefined' ||
        window.innerWidth < DESKTOP_PREVIEW_BREAKPOINT ||
        !rowElement ||
        !railElement ||
        !cardElement ||
        cardHeight === 0
      ) {
        setDesktopPreviewLayout((current) =>
          isSameDesktopPreviewLayout(current, { mode: 'static' }) ? current : { mode: 'static' }
        );
        return;
      }

      const rowRect = rowElement.getBoundingClientRect();
      const railRect = railElement.getBoundingClientRect();
      const scrollY = window.scrollY;
      const rowTop = rowRect.top + scrollY;
      const rowHeight = rowElement.offsetHeight;
      const maxAbsoluteTop = Math.max(0, rowHeight - cardHeight);
      const fixedStart = rowTop - FLOATING_PREVIEW_TOP;
      const fixedEnd = rowTop + maxAbsoluteTop - FLOATING_PREVIEW_TOP;

      if (scrollY <= fixedStart) {
        setDesktopPreviewLayout((current) =>
          isSameDesktopPreviewLayout(current, { mode: 'static' }) ? current : { mode: 'static' }
        );
        return;
      }

      if (scrollY >= fixedEnd) {
        const nextLayout: DesktopPreviewLayout = {
          mode: 'absolute',
          top: maxAbsoluteTop,
        };
        setDesktopPreviewLayout((current) =>
          isSameDesktopPreviewLayout(current, nextLayout) ? current : nextLayout
        );
        return;
      }

      const nextLayout: DesktopPreviewLayout = {
        mode: 'fixed',
        left: railRect.left,
        width: railRect.width,
      };
      setDesktopPreviewLayout((current) =>
        isSameDesktopPreviewLayout(current, nextLayout) ? current : nextLayout
      );
    };

    const requestUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateDesktopPreviewLayout);
    };

    requestUpdate();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, [cardElement, cardHeight, isEnabled, railElement, rowElement]);

  const effectiveDesktopPreviewLayout = isEnabled
    ? desktopPreviewLayout
    : ({ mode: 'static' } satisfies DesktopPreviewLayout);

  const railSpacerHeight =
    effectiveDesktopPreviewLayout.mode === 'absolute'
      ? effectiveDesktopPreviewLayout.top + cardHeight
      : effectiveDesktopPreviewLayout.mode === 'fixed'
        ? cardHeight
        : undefined;

  return {
    desktopPreviewLayout: effectiveDesktopPreviewLayout,
    rowRef,
    railRef,
    cardRef,
    railSpacerHeight,
    floatingPreviewTop: FLOATING_PREVIEW_TOP,
  };
}
