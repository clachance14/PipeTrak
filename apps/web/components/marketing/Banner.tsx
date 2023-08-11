"use client";

import { Button, Icon } from "@components";
import { useEffect, useState } from "react";

const BANNER_HIDDEN_STORAGE_KEY = "banner-hidden";

export default function Banner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(BANNER_HIDDEN_STORAGE_KEY)) {
      setShowBanner(true);
    }
  }, []);

  function hideBanner() {
    localStorage.setItem(BANNER_HIDDEN_STORAGE_KEY, "true");
    setShowBanner(false);
  }

  if (!showBanner) {
    return null;
  }

  return (
    <div className="bg-primary/10 text-primary-950/75 dark:text-primary-100/75 inset-0 bottom-auto px-8 py-4 text-center text-sm data-[state='open']:block data-[state='closed']:hidden">
      <strong>New:</strong> In this banner you can show your awesome new feature
      <Button variant="link" onClick={hideBanner}>
        <Icon.close />
      </Button>
    </div>
  );
}
