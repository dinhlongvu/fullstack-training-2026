// Storybook configuration for the Card component and its sub-components.
// Cards are used to group related information in a visually distinct container.
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../Card";
import { Input } from "../Input";
import { Label } from "../Label";

// Metadata for the Card component stories.
const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

// A basic card layout containing only a header and main content area.
export const Basic: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content</p>
      </CardContent>
    </Card>
  ),
};

// A comprehensive card layout demonstrating form composition.
// Includes header, structured content area with inputs, and a footer for actions.
export const WithHeaderAndFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create Project</CardTitle>
        <CardDescription>
          Deploy your new project in one-click.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Project name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="desc">Description</Label>
          <Input id="desc" placeholder="Project description" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Create</Button>
      </CardFooter>
    </Card>
  ),
};

// An interactive card variant.
// Demonstrates hover states and cursor styling for cards that act as clickable elements.
export const Interactive: Story = {
  render: () => (
    <Card className="w-[350px] cursor-pointer transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">TaskBoard</CardTitle>
        <CardDescription className="line-clamp-2">
          A simple Kanban-style task board for team collaboration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">3 members</p>
      </CardContent>
    </Card>
  ),
};
