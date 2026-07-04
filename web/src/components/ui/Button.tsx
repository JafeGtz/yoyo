import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

const estilos: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-600/25 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50',
  secondary:
    'border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50',
  danger:
    'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-sm shadow-rose-600/25 hover:from-rose-600 hover:to-rose-700 disabled:opacity-50',
  ghost: 'text-gray-600 hover:bg-gray-100',
};

const tamanos: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:cursor-not-allowed ${tamanos[size]} ${estilos[variant]} ${className}`}
      {...rest}
    />
  );
}
