
'use client';

import type { AttendanceRecord } from '@/services/attendance';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface AttendanceOverviewCardProps {
  attendanceRecords: AttendanceRecord[];
}

export function AttendanceOverviewCard({ attendanceRecords }: AttendanceOverviewCardProps) {
  // Sort records by date descending and take the most recent 5
  const recentRecords = [...attendanceRecords]
    .sort((a, b) => {
        // Handle potential invalid date strings
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  const hasData = recentRecords.length > 0;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Recent Attendance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Lecture/Subject</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRecords.map((record, index) => {
                  const date = parseISO(record.date);
                  return (
                    <TableRow key={`${record.date}-${record.lectureName}-${index}`}>
                      <TableCell className="whitespace-nowrap">{!isNaN(date.getTime()) ? format(date, 'PP') : 'Invalid Date'}</TableCell>
                      <TableCell>{record.lectureName || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={record.status === 'present' ? 'default' : 'destructive'}
                          className={cn(record.status === 'present' && 'bg-green-600')}
                        >
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex h-full min-h-[150px] items-center justify-center">
            <p className="text-center text-muted-foreground">No attendance data available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
