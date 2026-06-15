import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';

export function HomePage() {
  const [count, setCount] = useState(0);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md taskboard-home-card">
        <CardHeader>
          <CardTitle>TaskBoard</CardTitle>
          <CardDescription>Frontend setup verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Counter: <span className="font-medium text-foreground">{count}</span>
          </p>
          <Button type="button" onClick={() => setCount((value) => value + 1)}>
            Count +1
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
