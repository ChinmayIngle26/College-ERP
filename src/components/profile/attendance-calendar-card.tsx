
'use client';

import type { AttendanceRecord } from '@/services/attendance';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useMemo } from 'react';
import { parseISO, format, isSameDay } from 'date-fns';
import { CalendarDays } from 'lucide-react';

interface AttendanceCalendarCardProps {
  attendanceRecords: AttendanceRecord[];
}

type DailyStatus = 'present' | 'absent' | 'mixed';

export function AttendanceCalendarCard({ attendanceRecords }: AttendanceCalendarCardProps) {
  const dailyAttendanceStatus = useMemo(() => {
    const statusMap: Map<string, DailyStatus> = new Map();
    if (!attendanceRecords) return statusMap;

    const recordsByDay: Map<string, ('present' | 'absent')[]> = new Map();

    // Group records by day
    attendanceRecords.forEach(record => {
      const day = format(parseISO(record.date), 'yyyy-MM-dd');
      if (!recordsByDay.has(day)) {
        recordsByDay.set(day, []);
      }
      recordsByDay.get(day)!.push(record.status);
    });

    // Determine the status for each day
    recordsByDay.forEach((statuses, day) => {
      if (statuses.every(s => s === 'present')) {
        statusMap.set(day, 'present');
      } else if (statuses.every(s => s === 'absent')) {
        statusMap.set(day, 'absent');
      } else {
        statusMap.set(day, 'mixed');
      }
    });

    return statusMap;
  }, [attendanceRecords]);

  const presentDays = useMemo(() => {
    return Array.from(dailyAttendanceStatus.entries())
      .filter(([, status]) => status === 'present')
      .map(([day]) => parseISO(day));
  }, [dailyAttendanceStatus]);

  const absentDays = useMemo(() => {
    return Array.from(dailyAttendanceStatus.entries())
      .filter(([, status]) => status === 'absent')
      .map(([day]) => parseISO(day));
  }, [dailyAttendanceStatus]);

  const mixedDays = useMemo(() => {
    return Array.from(dailyAttendanceStatus.entries())
      .filter(([, status]) => status === 'mixed')
      .map(([day]) => parseISO(day));
  }, [dailyAttendanceStatus]);
  
  const today = new Date();

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Attendance Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <style>{`
          .day-present { 
            background-color: hsl(var(--chart-1) / 0.3) !important;
            color: hsl(var(--foreground)) !important;
            border: 1px solid hsl(var(--chart-1));
          }
          .day-present:hover {
             background-color: hsl(var(--chart-1) / 0.5) !important;
          }
          .day-absent {
            background-color: hsl(var(--chart-4) / 0.3) !important;
            color: hsl(var(--foreground)) !important;
            border: 1px solid hsl(var(--chart-4));
          }
          .day-absent:hover {
            background-color: hsl(var(--chart-4) / 0.5) !important;
          }
          .day-mixed {
            background-color: hsl(var(--chart-5) / 0.3) !important;
            color: hsl(var(--foreground)) !important;
            border: 1px solid hsl(var(--chart-5));
          }
          .day-mixed:hover {
            background-color: hsl(var(--chart-5) / 0.5) !important;
          }
          .rdp-day_today:not(.day-present):not(.day-absent):not(.day-mixed) {
            background-color: hsl(var(--accent));
            font-weight: bold;
          }
        `}</style>
        <Calendar
          mode="multiple"
          selected={[...presentDays, ...absentDays, ...mixedDays]}
          defaultMonth={today}
          modifiers={{
            present: presentDays,
            absent: absentDays,
            mixed: mixedDays,
            today: today
          }}
          modifiersClassNames={{
            present: 'day-present',
            absent: 'day-absent',
            mixed: 'day-mixed',
          }}
          className="rounded-md border p-2"
          showOutsideDays
          fixedWeeks
        />
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-green-500/50 border border-green-600"></div>
                <span>Present</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-red-500/50 border border-red-600"></div>
                <span>Absent</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-orange-500/50 border border-orange-600"></div>
                <span>Mixed</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
