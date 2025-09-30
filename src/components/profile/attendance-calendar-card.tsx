
'use client';

import type { AttendanceRecord } from '@/services/attendance';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useState, useMemo } from 'react';
import { parseISO, format, isSameDay, isValid } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AttendanceCalendarCardProps {
  attendanceRecords: AttendanceRecord[];
}

type DailyStatus = 'present' | 'absent' | 'mixed';

export function AttendanceCalendarCard({ attendanceRecords }: AttendanceCalendarCardProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const dailyAttendanceStatus = useMemo(() => {
    const statusMap: Map<string, DailyStatus> = new Map();
    if (!attendanceRecords) return statusMap;

    const recordsByDay: Map<string, ('present' | 'absent')[]> = new Map();

    attendanceRecords.forEach(record => {
      if (isValid(parseISO(record.date))) {
        const day = format(parseISO(record.date), 'yyyy-MM-dd');
        if (!recordsByDay.has(day)) {
          recordsByDay.set(day, []);
        }
        recordsByDay.get(day)!.push(record.status);
      }
    });

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

  const handleDayClick = (day: Date) => {
    const dayString = format(day, 'yyyy-MM-dd');
    if (dailyAttendanceStatus.has(dayString)) {
        setSelectedDate(day);
        setIsDialogOpen(true);
    }
  };

  const recordsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return attendanceRecords.filter(record => {
        if (!isValid(parseISO(record.date))) return false;
        return isSameDay(parseISO(record.date), selectedDate);
    });
  }, [selectedDate, attendanceRecords]);


  return (
    <>
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
              background: repeating-linear-gradient(45deg, hsl(var(--chart-1) / 0.3), hsl(var(--chart-1) / 0.3) 5px, hsl(var(--chart-4) / 0.3) 5px, hsl(var(--chart-4) / 0.3) 10px) !important;
              color: hsl(var(--foreground)) !important;
              border: 1px solid hsl(var(--primary));
            }
            .day-mixed:hover {
              background: repeating-linear-gradient(45deg, hsl(var(--chart-1) / 0.5), hsl(var(--chart-1) / 0.5) 5px, hsl(var(--chart-4) / 0.5) 5px, hsl(var(--chart-4) / 0.5) 10px) !important;
            }
            .rdp-day_today:not(.day-present):not(.day-absent):not(.day-mixed) {
              background-color: hsl(var(--accent));
              font-weight: bold;
            }
            .rdp-day:not([aria-disabled="true"]){
                cursor: pointer;
            }
          `}</style>
          <Calendar
            mode="multiple"
            selected={[...presentDays, ...absentDays, ...mixedDays]}
            defaultMonth={today}
            onDayClick={handleDayClick}
            modifiers={{
              present: presentDays,
              absent: absentDays,
              mixed: mixedDays,
              today: today,
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
                <div 
                    className="h-4 w-4 rounded-full border border-primary"
                    style={{ background: 'repeating-linear-gradient(45deg, hsl(var(--chart-1) / 0.5), hsl(var(--chart-1) / 0.5) 4px, hsl(var(--chart-4) / 0.5) 4px, hsl(var(--chart-4) / 0.5) 8px)'}}
                ></div>
                <span>Mixed</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
            <DialogDescription>
              {selectedDate ? `Showing records for ${format(selectedDate, 'PPP')}.` : 'No date selected.'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Lecture/Subject</TableHead>
                        <TableHead>Classroom</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recordsForSelectedDate.map((record, index) => (
                        <TableRow key={`${record.date}-${record.lectureName}-${index}`}>
                            <TableCell>{record.lectureName || 'N/A'}</TableCell>
                            <TableCell>{record.classroomName || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                                <Badge
                                    variant={record.status === 'present' ? 'default' : 'destructive'}
                                    className={cn(record.status === 'present' && 'bg-green-600')}
                                >
                                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
