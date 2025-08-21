
'use client';

import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export default function LeaveApplicationPageRemoved() {
  return (
    <>
      <MainHeader />
      <div className="space-y-8 p-4 md:p-6 lg:p-8">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Feature Not Available
        </h2>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Leave Application Feature Removed</CardTitle>
            <CardDescription>This feature has been removed from the application.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>The leave application functionality is no longer available.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
