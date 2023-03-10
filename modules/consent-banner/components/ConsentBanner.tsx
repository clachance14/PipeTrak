'use client';

import Button from '@common/components/primitives/Button';
import { getCookie, setCookie } from '@common/utils/cookies';
import { useEffect, useState } from 'react';
import { RxCookie } from 'react-icons/rx';

export default function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!getCookie('consent')) setShowBanner(true);
  }, []);

  if (!showBanner) return null;

  const handleAllow = () => {
    setCookie('consent', 'true', 30);
    setShowBanner(false);
  };

  const handleDecline = () => {
    setCookie('consent', 'true', 1);
    setShowBanner(false);
  };

  return (
    <div className="bottom fixed right-4 bottom-4 max-w-md">
      <div className="flex gap-4 rounded-xl border bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
        <RxCookie className="block flex-shrink-0 text-5xl text-blue-500" />
        <div>
          <p className="text-sm leading-normal">
            We use tracking cookies to understand how you use the product and help us improve it. Please accept cookies
            to help us improve.
          </p>
          <div className="mt-4 flex gap-4">
            <Button size="small" intent="primary-ghost" className="flex-1" onClick={() => handleDecline()}>
              Decline
            </Button>
            <Button size="small" intent="primary" className="flex-1" onClick={() => handleAllow()}>
              Allow
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
