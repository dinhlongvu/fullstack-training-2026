// Storybook configuration for the Button component.
// This file defines how the Button component is rendered in the Storybook UI,
// showcasing all its variants, sizes, and specific states (like loading or disabled).
// It serves as both documentation and a visual regression testing baseline.
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Loader2, Mail } from "lucide-react";
import { Button } from "../Button";

// Default metadata for the Button component stories.
// - title: Determines the component's location in the Storybook sidebar (e.g., UI > Button).
// - component: The actual React component being documented.
// - tags: ['autodocs'] enables auto-generated documentation pages.
// - argTypes: Configures the control types in the Storybook UI (e.g., turning string props into dropdown selects).
const meta: Meta<typeof Button> = {
    title: "UI/Button",
    component: Button,
    tags: ["autodocs"],
    argTypes: {
        variant: {
            control: "select",
            options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
            description: "Visual variant of the button",
        },
        size: {
            control: "select",
            options: ["default", "sm", "lg", "icon"],
            description: "Size preset of the button",
        },
    },
};

export default meta;

// Type alias for individual stories
type Story = StoryObj<typeof Button>;

// The default button variant.
// Used for primary actions in the application.
export const Default: Story = {
    args: {
        children: "Button",
    },
};

// The secondary button variant.
// Used for alternative actions that shouldn't stand out as much as primary ones.
export const Secondary: Story = {
    args: {
        variant: "secondary",
        children: "Secondary",
    },
};

// The ghost button variant.
// Blends into the background until hovered. Good for tertiary actions.
export const Ghost: Story = {
    args: {
        variant: "ghost",
        children: "Ghost",
    },
};

// The destructive button variant.
// Used for dangerous actions like deleting data (e.g., Delete Project).
export const Destructive: Story = {
    args: {
        variant: "destructive",
        children: "Delete",
    },
};

// The outline button variant.
// Used for secondary actions that need to stand out more than ghost buttons.
export const Outline: Story = {
    args: {
        variant: "outline",
        children: "Outline",
    },
};

// The link button variant.
// Looks like a standard text link but behaves as a button.
export const Link: Story = {
    args: {
        variant: "link",
        children: "Link Button",
    },
};

// Example of a button composed with an icon.
// Demonstrates component composition using lucide-react icons.
export const WithIcon: Story = {
    render: () => (
        <Button>
            <Mail className="mr-2 h-4 w-4" />
            Login with Email
        </Button>
    ),
};

// The loading state of the button.
// Disables the button and shows a spinning indicator. 
// Frequently used during API mutations (e.g., submitting a form).
export const Loading: Story = {
    render: () => (
        <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please wait
        </Button>
    ),
};

// The disabled state of the button.
// Prevents user interaction.
export const Disabled: Story = {
    args: {
        children: "Disabled",
        disabled: true,
    },
};

// The small size variant.
// Used in compact UIs like tables or small cards.
export const Small: Story = {
    args: {
        size: "sm",
        children: "Small",
    },
};

// The large size variant.
// Used for prominent calls to action (e.g., Hero sections).
export const Large: Story = {
    args: {
        size: "lg",
        children: "Large",
    },
};
