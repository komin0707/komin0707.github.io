import type { ComponentPropsWithoutRef } from 'react';
import './Panel.css';

function panelClassName(className?: string) {
  return ['panel', className].filter(Boolean).join(' ');
}

function Aside({ className, ...props }: ComponentPropsWithoutRef<'aside'>) {
  return <aside className={panelClassName(className)} {...props} />;
}

function Heading(props: ComponentPropsWithoutRef<'h2'>) {
  return <h2 {...props} />;
}

export const Panel = {
  Aside,
  Heading,
};
