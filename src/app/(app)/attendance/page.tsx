
'use client'; 

import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { getAttendanceRecords } from '@/services/attendance'; 
import { useEffect, useState, useMemo } from 'react'; 
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context'; 
import { auth as clientAuth } from '@/lib/firebase/client';
import type { AttendanceRecord } from '@/services/attendance'; 
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle } from 'lucide-react';

function AttendanceTableLoader() {
    const { user, loading: authLoading } = useAuth(); 
    const { toast } = useToast();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && user && clientAuth.currentUser) {
            const fetchRecords = async () => {
                setLoading(true);
                setError(null);
                try {
                    const idToken = await clientAuth.currentUser!.getIdToken(true); // Force refresh token
                    const fetchedRecords = await getAttendanceRecords(idToken); 
                    setRecords(fetchedRecords);
                } catch (err) {
                    console.error("Failed to fetch attendance records:", err);
                    const errorMessage = (err as Error).message || "An unknown error occurred.";
                    if (errorMessage.includes("Admin SDK initialization failed")) {
                        setError("Could not load attendance data because the server is not configured correctly. Please contact the administrator or check the GOOGLE_APPLICATION_CREDENTIALS_JSON variable in your .env.local file.");
                    } else {
                        setError("Could not load your attendance data. Please try again.");
                    }
                    toast({
                        title: "Error",
                        description: "Could not load your attendance data.",
                        variant: "destructive",
                    });
                } finally {
                    setLoading(false);
                }
            };
            fetchRecords();
        } else if (!authLoading && !user) {
             setLoading(false);
             setError("Please sign in to view attendance.");
        }
    }, [user, authLoading, toast]); 

    const groupedRecords = useMemo(() => {
        if (records.length === 0) return {};

        const groups: { [dateKey: string]: AttendanceRecord[] } = {};

        records.forEach(record => {
            const dateKey = record.date;
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(record);
        });

        return groups;
    }, [records]);

    const sortedDates = useMemo(() => Object.keys(groupedRecords).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()), [groupedRecords]);

    if (loading || authLoading) {
      return (
        <Card>
            <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
            <CardContent><Skeleton className="h-96 w-full" /></CardContent>
        </Card>
      );
    }

    if (error) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-6 w-6" />
                        Error Loading Attendance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{error}</p>
                </CardContent>
            </Card>
        );
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Attendance Records</CardTitle>
        <CardDescription>Your day-by-day attendance summary across all subjects.</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedDates.length > 0 ? (
          <Accordion type="single" collapsible className="w-full space-y-2">
            {sortedDates.map((date) => (
                <AccordionItem value={date} key={date} className="border rounded-lg px-4 bg-muted/20">
                    <AccordionTrigger className="hover:no-underline">
                        <span className="font-semibold text-primary">{format(parseISO(date), 'PPP')}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="overflow-x-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Subject/Topic</TableHead>
                                    <TableHead>Classroom</TableHead>
                                    <TableHead>Faculty</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {groupedRecords[date].map((record, index) => ( 
                                    <TableRow key={`${record.date}-${record.lectureName}-${index}`}>
                                    <TableCell>{record.lectureName || 'N/A'}</TableCell>
                                    <TableCell>{record.classroomName || 'N/A'}</TableCell>
                                    <TableCell>{record.facultyName || 'N/A'}</TableCell>
                                    <TableCell
                                        className={cn(
                                        'text-right font-medium',
                                        record.status === 'present' ? 'text-green-600' : 'text-red-600' 
                                        )}
                                    >
                                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                    </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
          </Accordion>
        ) : (
           <p className="text-center text-muted-foreground py-8">No attendance records found.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AttendancePage() {
  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Attendance
        </h2>
        <AttendanceTableLoader />
      </div>
    </>
  );
}
