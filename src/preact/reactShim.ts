import {
  Component,
  Fragment,
  cloneElement,
  createContext,
  h as createElement,
  isValidElement,
  options,
  toChildArray,
  type ComponentChildren,
  type VNode,
} from 'preact';
import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'preact/hooks';

const StrictMode = Fragment;
const memo = <T>(component: T): T => component;
const attributeAliases = {
  _A: 'data-testid',
  _B: 'aria-label',
  _C: 'aria-hidden',
  _D: 'aria-describedby',
  _E: 'aria-labelledby',
  _F: 'aria-live',
  _G: 'aria-atomic',
  _H: 'aria-modal',
  _I: 'aria-checked',
  _J: 'aria-selected',
  _K: 'aria-valuemax',
  _L: 'aria-valuemin',
  _M: 'aria-valuenow',
  _N: 'htmlFor',
  _O: 'tabIndex',
  _P: 'onClick',
  _Q: 'onChange',
  _R: 'onSubmit',
  _S: 'onKeyDown',
  _T: 'onContextMenu',
  _U: 'onDragOver',
  _V: 'onDrop',
  _W: 'onTouchEnd',
  _X: 'onTouchMove',
  _Y: 'onTouchStart',
  _Z: 'type',
  _aa: 'value',
  _ab: 'min',
  _ac: 'max',
  _ad: 'step',
  _ae: 'style',
  _af: 'title',
  _ag: 'disabled',
  _ah: 'placeholder',
  _ai: 'inputMode',
  _aj: 'href',
  _ak: 'aria-invalid',
  _al: 'aria-required',
  _am: 'data-scenario-pending',
  _an: 'data-waveform-kind',
  _ao: 'data-palette',
  _ap: 'data-scroll-bucket',
  _aq: 'data-viewport-width',
  _ar: 'data-fio2',
  _as: 'data-breath-source',
  _at: 'data-breath-pattern',
  _au: 'data-condition',
  _av: 'data-expression',
  _aw: 'data-alarm-level',
  clipPath: 'clip-path',
  dominantBaseline: 'dominant-baseline',
  fillOpacity: 'fill-opacity',
  fillRule: 'fill-rule',
  shapeRendering: 'shape-rendering',
  stopColor: 'stop-color',
  stopOpacity: 'stop-opacity',
  strokeDasharray: 'stroke-dasharray',
  strokeDashoffset: 'stroke-dashoffset',
  strokeLinecap: 'stroke-linecap',
  strokeLinejoin: 'stroke-linejoin',
  strokeMiterlimit: 'stroke-miterlimit',
  strokeOpacity: 'stroke-opacity',
  strokeWidth: 'stroke-width',
  textAnchor: 'text-anchor',
  vectorEffect: 'vector-effect',
  _q: 'className',
  _r: 'children',
  _s: 'fill',
  _t: 'stroke',
  _u: 'opacity',
  _v: 'width',
  _w: 'height',
  _x: 'viewBox',
  _y: 'preserveAspectRatio',
  _z: 'role',
} as const satisfies Record<string, string>;

type AttributeAlias = keyof typeof attributeAliases;

const previousVNodeHook = options.vnode;

options.vnode = (vnode) => {
  normalizeSvgAttributeNames(vnode);
  previousVNodeHook?.(vnode);
};

function normalizeSvgAttributeNames(vnode: VNode): void {
  if (typeof vnode.type !== 'string') return;
  const props = vnode.props as Record<string, unknown>;
  for (const alias of Object.keys(attributeAliases) as AttributeAlias[]) {
    applyAttributeAlias(props, alias);
  }
}

function applyAttributeAlias(props: Record<string, unknown>, alias: AttributeAlias): void {
  const value = props[alias];
  if (value === undefined) return;
  props[attributeAliases[alias]] = value;
  delete props[alias];
}

const lazy = <T>(loader: () => Promise<{ default: T }>): T => {
  let loaded: T | null = null;
  let loading: Promise<void> | null = null;
  const load = () => {
    loading ??= loader().then((module) => {
      loaded = module.default;
    });
    return loading;
  };
  return ((props: unknown) => {
    const [, setVersion] = useState(0);
    useEffect(() => {
      void load().then(() => setVersion((version) => version + 1));
    }, []);
    if (!loaded) return null;
    return (loaded as (props: unknown) => unknown)(props);
  }) as T;
};
const Suspense = ({ children }: { children?: unknown }) => children;
const useDeferredValue = <T>(value: T): T => value;
const useLayoutEffect = useEffect;
const useTransition = (): [boolean, (callback: () => void) => void] => [false, (callback) => callback()];
const version = '19.1.1';

export {
  Component,
  cloneElement,
  createElement,
  Fragment,
  isValidElement,
  StrictMode,
  Suspense,
  createContext,
  lazy,
  memo,
  useCallback,
  useContext,
  useDeferredValue,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useTransition,
  version,
};

const Children = {
  count: (children: ComponentChildren) => toChildArray(children).length,
  map: <T>(children: ComponentChildren, callback: (child: unknown, index: number) => T): T[] =>
    toChildArray(children).map(callback),
  toArray: toChildArray,
};

export { Children };

export default {
  Children,
  Component,
  Fragment,
  StrictMode,
  cloneElement,
  createElement,
  isValidElement,
  useLayoutEffect,
  version,
};
