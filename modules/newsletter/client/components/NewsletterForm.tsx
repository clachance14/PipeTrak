'use client';

import Button from '@common/components/primitives/Button';
import Input from '@common/components/primitives/Input';

export function NewsletterForm() {
  return (
    <div className="flex items-start">
      <Input type="email" placeholder="Your email" />
      <Button className="ml-4">Subscribe</Button>
    </div>
  );
}
