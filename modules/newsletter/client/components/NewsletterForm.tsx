import { Button, Input } from '@common/client';

export function NewsletterForm() {
  return (
    <div className="flex items-start">
      <Input type="email" placeholder="Your email" />
      <Button className="ml-4">Subscribe</Button>
    </div>
  );
}
