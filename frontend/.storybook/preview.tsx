// .storybook/preview.ts
import type { Preview } from "@storybook/react";
import "../src/index.css"; // Import Tailwind + shadcn CSS variables

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
