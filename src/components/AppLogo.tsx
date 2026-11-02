import { School } from 'lucide-react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: { box: 'size-9 rounded-xl', icon: 'size-5' },
  md: { box: 'size-12 rounded-2xl', icon: 'size-6' },
  lg: { box: 'size-20 rounded-3xl', icon: 'size-10' },
} as const;

export function AppLogo({ size = 'md' }: AppLogoProps) {
  const { box, icon } = SIZE_CLASSES[size];
  return (
    <div className={`flex shrink-0 items-center justify-center bg-primary-600 text-white shadow-lg shadow-primary-600/25 ${box}`}>
      <School className={icon} aria-hidden />
    </div>
  );
}
