import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Base styles using CVA for future variants.
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

// Accessible Label component wrapping Radix UI.
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    // Merge base styles with custom classes safely.
    className={cn(labelVariants(), className)}
    {...props}
  />
));

// Set displayName for React DevTools.
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
