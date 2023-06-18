export function createApiFetch(config: {
  baseUrl: string;
  fetchOptions?: RequestInit;
}) {
  const { baseUrl, fetchOptions } = config;

  return (endpoint: string, options?: RequestInit) => {
    const url = `${baseUrl}${endpoint}`;

    return fetch(url, {
      ...fetchOptions,
      ...options,
      cache: "no-cache",
    }).then(async (response) => {
      if (response.ok) {
        return response.json();
      }

      throw new Error(
        `Request failed: ${response.status} ${response.statusText}`,
      );
    });
  };
}

export const lemonsqueezyApi = (() => {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;

  if (!apiKey) {
    throw new Error("Environment variable LEMONSQUEEZY_API_KEY is not defined");
  }

  return createApiFetch({
    baseUrl: "https://api.lemonsqueezy.com/v1",
    fetchOptions: {
      headers: new Headers({
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      }),
    },
  });
})();
