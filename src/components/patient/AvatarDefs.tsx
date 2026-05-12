import type { ReactNode } from 'react';

export function AvatarDefs(): ReactNode {
  return (
    <defs>
      <linearGradient id="bedBase" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#7d9ab0" /> <stop offset="48%" stopColor="#274c67" />{' '}
        <stop offset="100%" stopColor="#071a2b" />
      </linearGradient>
      <linearGradient id="mattressDepth" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#294c66" /> <stop offset="100%" stopColor="#071423" />
      </linearGradient>
      <radialGradient id="skinClinical" cx="46%" cy="28%" r="76%">
        <stop offset="0%" stopColor="#f1cbbb" /> <stop offset="58%" stopColor="#c1816c" />{' '}
        <stop offset="100%" stopColor="#75413a" />
      </radialGradient>
      <linearGradient id="blueDrape" x1="0" x2="1">
        <stop offset="0%" stopColor="#438397" /> <stop offset="48%" stopColor="#1d516b" />{' '}
        <stop offset="100%" stopColor="#082235" />
      </linearGradient>
      <linearGradient id="torsoGlass" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#fff2e8" stopOpacity="0.46" />
        <stop offset="52%" stopColor="#e4aa9d" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#2b2230" stopOpacity="0.05" />
      </linearGradient>
      <linearGradient id="lungTissue" x1="0" x2="1">
        <stop offset="0%" stopColor="#8e344b" /> <stop offset="50%" stopColor="#de8384" />{' '}
        <stop offset="100%" stopColor="#713044" />
      </linearGradient>
      <linearGradient id="maskShell" x1="0" x2="1">
        <stop offset="0%" stopColor="#d7e5ed" /> <stop offset="54%" stopColor="#fbfdff" />{' '}
        <stop offset="100%" stopColor="#9eb2bf" />
      </linearGradient>
      <linearGradient id="tubeGradient" x1="0" x2="1">
        <stop offset="0%" stopColor="#f2fbff" /> <stop offset="45%" stopColor="#a3c8dd" />{' '}
        <stop offset="100%" stopColor="#5d7f96" />
      </linearGradient>
      <linearGradient id="blueCircuit" x1="0" x2="1">
        <stop offset="0%" stopColor="#3799f1" /> <stop offset="100%" stopColor="#b9e5ff" />
      </linearGradient>
      <radialGradient id="electrodePad" cx="42%" cy="34%" r="70%">
        <stop offset="0%" stopColor="#f8fcff" /> <stop offset="72%" stopColor="#b4c6d2" />{' '}
        <stop offset="100%" stopColor="#516d82" />
      </radialGradient>
      <filter id="softShadow" x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="0" dy="10" floodColor="#000814" floodOpacity="0.42" stdDeviation="8" />
      </filter>
    </defs>
  );
}
