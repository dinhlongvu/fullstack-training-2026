// Storybook configuration for the Input component.
// Demonstrates various states and compositions of the standard HTML input wrapper.
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "../Input";
import { Label } from "../Label";


// Metadata for the Input component stories.
const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Input>;


// The default input field state.
export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};


// An input field composed with a Label.
// Demonstrates accessibility best practices using htmlFor and id linking.
export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};

// An input field with additional helper text.
// Used for providing instructions or hints about the expected input format.
export const WithHelperText: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="password">Password</Label>
      <Input id="password" type="password" placeholder="••••••••" />
      <p className="text-sm text-muted-foreground">
        Must be at least 8 characters.
      </p>
    </div>
  ),
};


// The error state of an input field.
// Demonstrates styling changes and error message presentation when validation fails.
export const Error: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email-err" className="text-destructive">Email</Label>
      <Input
        id="email-err"
        type="email"
        placeholder="you@example.com"
        className="border-destructive"
      />
      <p className="text-sm text-destructive">
        Please enter a valid email address.
      </p>
    </div>
  ),
};

// The disabled state of an input field.
// Prevents user interaction and visually indicates unavailability.
export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
  },
};

// A file input variant.
// Shows how the base Input component handles file upload styling.
export const FileInput: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="avatar">Avatar</Label>
      <Input id="avatar" type="file" />
    </div>
  ),
};
