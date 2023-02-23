import { useTheme } from 'next-themes';
import NextNProgress from 'nextjs-progressbar';
import { useIsClient } from 'usehooks-ts';

export function ProgressBar() {
  const { resolvedTheme } = useTheme();
  const isClientSide = useIsClient();

  if (!isClientSide) {
    return null;
  }

  return <NextNProgress height={4} color={resolvedTheme === 'light' ? '#000000' : '#ffffff'} showOnShallow={true} />;
}
