import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: 'd6qqrf',
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:3000',
  },
});
