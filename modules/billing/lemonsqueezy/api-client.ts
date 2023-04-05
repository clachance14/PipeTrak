import { createApiFetch } from '../shared/api-client';

export const lemonsqueezyApi = createApiFetch({
  baseUrl: 'https://api.lemonsqueezy.com/v1',
  fetchOptions: {
    headers: new Headers({
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    }),
  },
});
