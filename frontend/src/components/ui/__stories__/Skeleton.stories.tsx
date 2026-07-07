// Storybook configuration for the Skeleton component.
// Skeletons are used as placeholders while content is loading, 
// improving perceived performance and preventing layout shifts.
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "../Skeleton";

// Metadata for the Skeleton component stories.
const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

// Skeleton configured to mimic multiple lines of text.
// Demonstrates width variations to simulate paragraph structures.
export const TextLines: Story = {
  render: () => (
    <div className="w-[350px] space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  ),
};

// A complex skeleton layout mimicking a Card component.
// Useful for loading states of lists or grids of items.
export const CardSkeleton: Story = {
  render: () => (
    <div className="w-[350px] rounded-lg border p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  ),
};

// Custom shaped skeletons representing specific UI elements.
// Example shows an avatar (circle) next to text lines.
export const CustomShape: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[160px]" />
      </div>
    </div>
  ),
};
