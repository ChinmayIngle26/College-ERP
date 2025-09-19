
'use client';
import { MainHeader } from '@/components/layout/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, CheckCircle, User, Users, BookOpen, Loader2, Search, Download, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { auth as clientAuth } from '@/lib/firebase/client';
import { getClassroomsByFaculty, getStudentsInClassroom } from '@/services/classroomService';
import { submitLectureAttendance, getLectureAttendanceForDate, getLectureAttendanceForDateRange } from '@/services/attendance';
import type { Classroom, ClassroomStudentInfo } from '@/types/classroom';
import type { LectureAttendanceRecord } from '@/types/lectureAttendance';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { exportDataToCsv } from '@/lib/csv-exporter';
import { Slider } from '@/components/ui/slider';


type StudentAttendanceStatus = {
    [studentId: string]: boolean; // true for present, false for absent
};

interface LowAttendanceStudent {
    studentId: string;
    name: string;
    studentIdNumber: string;
    totalLectures: number;
    attendedLectures: number;
    percentage: number;
}

const WHOLE_CLASS_FILTER_VALUE = "__WHOLE_CLASS__";

export default function FacultyAttendancePage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

    // Shared state
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loadingClassrooms, setLoadingClassrooms] = useState(true);
    const [selectedClassroomId, setSelectedClassroomId] = useState<string | undefined>();
    const [currentStudents, setCurrentStudents] = useState<ClassroomStudentInfo[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    
    // State for Marking Tab
    const [uniqueBatchesInClassroom, setUniqueBatchesInClassroom] = useState<string[]>([]);
    const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>(WHOLE_CLASS_FILTER_VALUE);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [lectureSubjectTopic, setLectureSubjectTopic] = useState<string>('');
    const [attendanceStatus, setAttendanceStatus] = useState<StudentAttendanceStatus>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectAllChecked, setSelectAllChecked] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loadingPreviousAttendance, setLoadingPreviousAttendance] = useState(false);

    // State for Reports Tab
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [reportRecords, setReportRecords] = useState<LectureAttendanceRecord[]>([]);
    const [isFetchingRecords, setIsFetchingRecords] = useState(false);
    const [attendanceThreshold, setAttendanceThreshold] = useState<number>(75);

    // Memoize the calculation of student attendance statistics
    const studentStats = useMemo(() => {
        if (reportRecords.length === 0) return null;

        const stats: { [key: string]: { name: string; studentIdNumber: string; total: number; present: number; } } = {};
        reportRecords.forEach(record => {
            if (!stats[record.studentId]) {
                stats[record.studentId] = { 
                    name: record.studentName,
                    studentIdNumber: record.studentIdNumber || 'N/A',
                    total: 0, 
                    present: 0 
                };
            }
            stats[record.studentId].total++;
            if (record.status === 'present') {
                stats[record.studentId].present++;
            }
        });
        return stats;
    }, [reportRecords]);

    // Memoize the low attendance list based on the calculated stats and threshold
    const lowAttendanceStudents = useMemo(() => {
        if (!studentStats) return [];

        return Object.keys(studentStats).map(studentId => {
            const stats = studentStats[studentId];
            const percentage = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
            return {
                studentId,
                name: stats.name,
                studentIdNumber: stats.studentIdNumber,
                totalLectures: stats.total,
                attendedLectures: stats.present,
                percentage,
            };
        }).filter(student => student.percentage < attendanceThreshold)
          .sort((a,b) => a.percentage - b.percentage);
    }, [studentStats, attendanceThreshold]);


    const groupedReportRecords = useMemo(() => {
        if (reportRecords.length === 0) return [];

        const groupsByDate: { 
            [dateKey: string]: { 
                date: string; 
                lectures: { 
                    [lectureKey: string]: { lectureName: string; facultyName: string; records: LectureAttendanceRecord[] } 
                } 
            } 
        } = {};

        reportRecords.forEach(record => {
            const dateKey = record.date;
            if (!groupsByDate[dateKey]) {
                groupsByDate[dateKey] = {
                    date: dateKey,
                    lectures: {},
                };
            }

            const lectureKey = record.lectureName;
            if (!groupsByDate[dateKey].lectures[lectureKey]) {
                groupsByDate[dateKey].lectures[lectureKey] = {
                    lectureName: lectureKey,
                    facultyName: record.facultyName || 'N/A',
                    records: [],
                };
            }
            groupsByDate[dateKey].lectures[lectureKey].records.push(record);
        });

        return Object.values(groupsByDate)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(dateGroup => ({
                ...dateGroup,
                lectures: Object.values(dateGroup.lectures)
            }));
    }, [reportRecords]);

    useEffect(() => {
        if (user && !authLoading) {
          fetchFacultyClassrooms();
        }
    }, [user, authLoading]);

    const fetchFacultyClassrooms = async () => {
        if (!user || !clientAuth.currentUser) {
             toast({ title: "Authentication Error", description: "User not authenticated.", variant: "destructive" });
             setLoadingClassrooms(false);
             return;
        }
        setLoadingClassrooms(true);
        try {
          const idToken = await clientAuth.currentUser.getIdToken();
          const fetchedClassrooms = await getClassroomsByFaculty(idToken);
          setClassrooms(fetchedClassrooms);
        } catch (error) {
          console.error("Error fetching faculty classrooms:", error);
          toast({ title: "Error", description: "Could not load your classrooms.", variant: "destructive" });
        } finally {
          setLoadingClassrooms(false);
        }
    };
    
    const fetchStudentsForClassroom = async (classroomId: string) => {
        if (!user || !clientAuth.currentUser) {
            toast({ title: "Authentication Error", description: "User not authenticated.", variant: "destructive" });
            setLoadingStudents(false);
            return;
        }
        setLoadingStudents(true);
        try {
            const idToken = await clientAuth.currentUser.getIdToken();
            const students: ClassroomStudentInfo[] = await getStudentsInClassroom(idToken, classroomId);
            setCurrentStudents(students);
            
            const batches = new Set<string>();
            students.forEach(s => {
                if (s.batch && s.batch.trim() !== '') {
                    batches.add(s.batch.trim());
                }
            });
            setUniqueBatchesInClassroom(Array.from(batches).sort());
            setSelectAllChecked(false);
        } catch (error) {
            console.error("Error fetching students for classroom:", error);
            toast({ title: "Error", description: "Could not load students for this classroom.", variant: "destructive" });
            setCurrentStudents([]);
            setUniqueBatchesInClassroom([]);
        } finally {
            setLoadingStudents(false);
        }
    };

    useEffect(() => {
        if (selectedClassroomId && user && clientAuth.currentUser) {
            fetchStudentsForClassroom(selectedClassroomId);
            setReportRecords([]); // Clear reports when classroom changes
        } else {
            setCurrentStudents([]);
            setUniqueBatchesInClassroom([]);
            setAttendanceStatus({});
            setSelectedBatchFilter(WHOLE_CLASS_FILTER_VALUE);
            setSelectAllChecked(false);
            setReportRecords([]);
        }
    }, [selectedClassroomId, user]);
    
    useEffect(() => {
        const fetchPreviousAttendance = async () => {
            if (!selectedClassroomId || !selectedDate || !user || !clientAuth.currentUser) {
                setIsEditing(false);
                setLectureSubjectTopic('');
                const initialStatus: StudentAttendanceStatus = {};
                currentStudents.forEach(s => initialStatus[s.userId] = false); // Default to absent
                setAttendanceStatus(initialStatus);
                return;
            }

            setLoadingPreviousAttendance(true);
            try {
                const idToken = await clientAuth.currentUser.getIdToken();
                const dateString = format(selectedDate, 'yyyy-MM-dd');
                const previousRecords = await getLectureAttendanceForDate(idToken, selectedClassroomId, dateString);

                if (previousRecords && previousRecords.length > 0) {
                    setIsEditing(true);
                    setLectureSubjectTopic(previousRecords[0].lectureName);

                    const previousStatus: StudentAttendanceStatus = {};
                    currentStudents.forEach(student => {
                        const record = previousRecords.find(r => r.studentId === student.userId);
                        previousStatus[student.userId] = record ? record.status === 'present' : false;
                    });

                    setAttendanceStatus(previousStatus);
                    toast({
                        title: "Existing Record Loaded",
                        description: `Attendance for ${format(selectedDate, "PPP")} loaded for editing.`,
                    });
                } else {
                    setIsEditing(false);
                    setLectureSubjectTopic('');
                    const initialStatus: StudentAttendanceStatus = {};
                    currentStudents.forEach(s => initialStatus[s.userId] = false); // Default to absent
                    setAttendanceStatus(initialStatus);
                }
            } catch (error) {
                toast({ title: "Error", description: (error as Error).message || "Could not load previous attendance.", variant: "destructive" });
                setIsEditing(false);
            } finally {
                setLoadingPreviousAttendance(false);
            }
        };

        if (!loadingStudents && selectedClassroomId) {
            fetchPreviousAttendance();
        }
    }, [selectedClassroomId, selectedDate, user, loadingStudents]);

    const filteredStudentsToDisplay = useMemo(() => {
        let studentsToDisplay = currentStudents;

        if (selectedBatchFilter !== WHOLE_CLASS_FILTER_VALUE) {
            studentsToDisplay = currentStudents.filter(student => student.batch === selectedBatchFilter);
        }
        
        return studentsToDisplay.sort((a, b) => 
            (a.studentIdNumber || '').localeCompare(b.studentIdNumber || '', undefined, { numeric: true })
        );
    }, [currentStudents, selectedBatchFilter]);


    useEffect(() => {
        if (loadingStudents || isEditing) return;

        const newStatus: StudentAttendanceStatus = {};
        filteredStudentsToDisplay.forEach(s => {
            newStatus[s.userId] = attendanceStatus[s.userId] || false;
        });
        setAttendanceStatus(newStatus);

    }, [filteredStudentsToDisplay, loadingStudents, isEditing]);


    useEffect(() => {
        if (loadingStudents || loadingPreviousAttendance) return;
        if (filteredStudentsToDisplay.length > 0) {
            const allPresent = filteredStudentsToDisplay.every(student => attendanceStatus[student.userId] === true);
            setSelectAllChecked(allPresent);
        } else {
            setSelectAllChecked(false); 
        }
    }, [attendanceStatus, filteredStudentsToDisplay, loadingStudents, loadingPreviousAttendance]);

    const handleStatusChange = (studentUserId: string, status: boolean) => {
        setAttendanceStatus(prev => ({ ...prev, [studentUserId]: status }));
    };

    const handleSelectAllChange = (checked: boolean) => {
        setSelectAllChecked(checked);
        const newStatus: StudentAttendanceStatus = { ...attendanceStatus };
        filteredStudentsToDisplay.forEach(student => {
            newStatus[student.userId] = checked;
        });
        setAttendanceStatus(newStatus);
    };

    const selectedClassroomDetails = useMemo(() => {
        return classrooms.find(c => c.id === selectedClassroomId);
    }, [classrooms, selectedClassroomId]);

    const totalPresentStudents = useMemo(() => {
        return filteredStudentsToDisplay.filter(student => attendanceStatus[student.userId] === true).length;
    }, [attendanceStatus, filteredStudentsToDisplay]);

    const allStudentsHaveDefinedStatus = useMemo(() => {
        if (filteredStudentsToDisplay.length === 0) return true; 
        return filteredStudentsToDisplay.every(student => typeof attendanceStatus[student.userId] === 'boolean');
    }, [attendanceStatus, filteredStudentsToDisplay]);

    const handleSubmitAttendance = async () => {
        if (!user || !clientAuth.currentUser) {
            toast({ title: "Authentication Error", description: "Cannot submit attendance.", variant: "destructive" });
            return;
        }
        if (!selectedClassroomId || !selectedDate || !lectureSubjectTopic.trim()) {
            toast({ title: "Missing Information", description: "Please select classroom, date, and enter Lecture Topic.", variant: "destructive" });
            return;
        }
        if (!selectedClassroomDetails) {
            toast({ title: "Error", description: "Selected classroom details not found.", variant: "destructive" });
            return;
        }
        if(!allStudentsHaveDefinedStatus){
             toast({ title: "Incomplete Attendance", description: "Ensure every student is marked present or absent.", variant: "destructive" });
             return;
        }

        setIsSubmitting(true);
        const recordsToSubmit: Omit<LectureAttendanceRecord, 'id' | 'submittedAt'>[] = filteredStudentsToDisplay.map(student => ({
            classroomId: selectedClassroomId,
            classroomName: selectedClassroomDetails.name,
            facultyId: user.uid,
            facultyName: user.displayName || 'Faculty',
            date: format(selectedDate, "yyyy-MM-dd"),
            lectureName: lectureSubjectTopic,
            studentId: student.userId,
            studentName: student.name,
            studentIdNumber: student.studentIdNumber,
            status: attendanceStatus[student.userId] === true ? 'present' : 'absent',
            batch: selectedBatchFilter === WHOLE_CLASS_FILTER_VALUE ? undefined : selectedBatchFilter,
        }));

        try {
            await submitLectureAttendance(recordsToSubmit);
            const batchDescription = selectedBatchFilter === WHOLE_CLASS_FILTER_VALUE ? "whole class" : `batch ${selectedBatchFilter}`;
            toast({
                title: isEditing ? "Attendance Updated" : "Attendance Submitted",
                description: `Attendance for ${selectedClassroomDetails.name} (${batchDescription}) on ${format(selectedDate, "PPP")} saved.`,
            });
            setIsEditing(true); 
        } catch (error) {
            console.error("Error submitting attendance:", error);
            toast({ title: "Submission Failed", description: (error as Error).message || "Could not save attendance.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewRecords = async () => {
        if (!user || !clientAuth.currentUser) {
            toast({ title: "Authentication Error", description: "User not authenticated.", variant: "destructive" });
            return;
        }
        if (!selectedClassroomId || !startDate || !endDate) {
            toast({ title: "Missing Information", description: "Please select a classroom and a full date range.", variant: "destructive" });
            return;
        }
        if (endDate < startDate) {
            toast({ title: "Invalid Date Range", description: "End date cannot be before the start date.", variant: "destructive" });
            return;
        }

        setIsFetchingRecords(true);
        setReportRecords([]);
        try {
            const idToken = await clientAuth.currentUser.getIdToken();
            const fetchedRecords = await getLectureAttendanceForDateRange(
                idToken,
                selectedClassroomId,
                format(startDate, 'yyyy-MM-dd'),
                format(endDate, 'yyyy-MM-dd')
            );
            setReportRecords(fetchedRecords);
            
            if (fetchedRecords.length === 0) {
                 toast({ title: "No Records Found", description: "No attendance records were found for the selected classroom and date range."});
            }
        } catch (error) {
            console.error("Error fetching attendance records:", error);
            toast({ title: "Error Fetching Records", description: (error as Error).message || "Could not retrieve attendance records.", variant: "destructive" });
        } finally {
            setIsFetchingRecords(false);
        }
    };
    
    const handleDownloadReport = useCallback(() => {
        if (!studentStats || currentStudents.length === 0) {
            toast({ title: "No Data to Export", description: "Please fetch records before downloading a report.", variant: "destructive" });
            return;
        }
    
        const uniqueLectures = Array.from(new Map(reportRecords.map(r => [`${r.date}-${r.lectureName}`, r])).values())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
        const attendanceMap = new Map<string, 'P' | 'A'>();
        reportRecords.forEach(r => {
            attendanceMap.set(`${r.studentId}-${r.date}-${r.lectureName}`, r.status === 'present' ? 'P' : 'A');
        });
    
        const dataForCsv = currentStudents
            .sort((a,b) => (a.studentIdNumber || '').localeCompare(b.studentIdNumber || ''))
            .map((student, index) => {
                const rowData: Record<string, any> = {
                    'Sr. No': index + 1,
                    'Roll No': student.studentIdNumber,
                    'Name of Student': student.name,
                };
    
                const studentStat = studentStats[student.userId];
                const percentage = studentStat && studentStat.total > 0
                    ? ((studentStat.present / studentStat.total) * 100).toFixed(2) + '%'
                    : '0.00%';
                rowData['% Attendance'] = percentage;
    
                uniqueLectures.forEach(lecture => {
                    const lectureKey = `${format(new Date(lecture.date), 'dd-MM-yy')} - ${lecture.lectureName}`;
                    rowData[lectureKey] = attendanceMap.get(`${student.userId}-${lecture.date}-${lecture.lectureName}`) || 'A';
                });
    
                return rowData;
            });
    
        const classroomName = selectedClassroomDetails?.name || 'Classroom';
        const filename = `Attendance_Report_${classroomName}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        exportDataToCsv(dataForCsv, filename);
    }, [reportRecords, studentStats, currentStudents, selectedClassroomDetails]);
    

    const handleDownloadDefaulterReport = useCallback(() => {
        if (lowAttendanceStudents.length === 0) {
            toast({ title: "No Data to Export", description: "There are no students in the low attendance list.", variant: "destructive" });
            return;
        }

        const dataForCsv = lowAttendanceStudents.map(student => ({
            'Student ID': student.studentIdNumber,
            'Name': student.name,
            'Total Lectures': student.totalLectures,
            'Attended Lectures': student.attendedLectures,
            'Attendance %': student.percentage.toFixed(2),
        }));

        const classroomName = selectedClassroomDetails?.name || 'Classroom';
        const filename = `Low_Attendance_Report_${classroomName}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        exportDataToCsv(dataForCsv, filename);
    }, [lowAttendanceStudents, selectedClassroomDetails]);


    const handleThresholdInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 0 && value <= 100) {
            setAttendanceThreshold(value);
        } else if (e.target.value === '') {
            setAttendanceThreshold(0); // Or some other default
        }
    };


    if (authLoading) {
        return (
          <>
            <MainHeader />
            <div className="p-6 space-y-6">
              <Skeleton className="h-10 w-1/3" />
              <Card>
                <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                <CardContent className="space-y-4"><Skeleton className="h-64 w-full" /></CardContent>
              </Card>
            </div>
          </>
        );
      }

  return (
    <>
        <MainHeader />
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Faculty Attendance</h2>
            
            <Tabs defaultValue="mark" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
                <TabsTrigger value="reports">View Reports</TabsTrigger>
              </TabsList>
              
              <TabsContent value="mark" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Mark Daily Attendance</CardTitle>
                        <CardDescription>Select a classroom and date to mark new attendance or edit a previous record.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <Label htmlFor="classroom-mark">Classroom</Label>
                                {loadingClassrooms ? <Skeleton className="h-10 w-full" /> : (
                                    <Select value={selectedClassroomId} onValueChange={setSelectedClassroomId} disabled={classrooms.length === 0}>
                                        <SelectTrigger id="classroom-mark"><SelectValue placeholder={classrooms.length > 0 ? "Choose a classroom" : "No classrooms assigned"} /></SelectTrigger>
                                        <SelectContent>{classrooms.map(cr => (<SelectItem key={cr.id} value={cr.id}>{cr.name} ({cr.subject})</SelectItem>))}</SelectContent>
                                    </Select>)}
                            </div>
                            <div>
                                <Label htmlFor="date-mark">Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button id="date-mark" variant={"outline"} className={cn("w-full justify-start text-left font-normal",!selectedDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedDate && isValid(selectedDate) ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                    </Button></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus disabled={(date) => date > new Date() || date < new Date("2000-01-01")} /></PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <Label htmlFor="lectureSubjectTopic">Lecture Topic*</Label>
                                <Input id="lectureSubjectTopic" placeholder="e.g., CH-5 Thermodynamics" value={lectureSubjectTopic} onChange={(e) => setLectureSubjectTopic(e.target.value)}/>
                            </div>
                            <div>
                                <Label htmlFor="batchFilter">Filter by Batch</Label>
                                <Select value={selectedBatchFilter} onValueChange={setSelectedBatchFilter} disabled={!selectedClassroomId || uniqueBatchesInClassroom.length === 0}>
                                    <SelectTrigger id="batchFilter"><SelectValue placeholder="Whole Class" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={WHOLE_CLASS_FILTER_VALUE}>Whole Class</SelectItem>
                                        {uniqueBatchesInClassroom.map(batch => (<SelectItem key={batch} value={batch}>Batch {batch}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {selectedClassroomId && selectedDate && (
                    <Card className="mt-6">
                        <CardHeader className="bg-muted/50 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                                <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /><span className="font-semibold">Course:</span> {selectedClassroomDetails?.subject || 'N/A'}</div>
                                <div className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /><span className="font-semibold">Faculty:</span> {user?.displayName || 'N/A'}</div>
                                <div className="flex items-center gap-2"><CalendarIcon className="h-5 w-5 text-primary" /><span className="font-semibold">Date:</span> {isValid(selectedDate) ? format(selectedDate, "PPP") : 'N/A'}</div>
                                <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /><span className="font-semibold">Topic:</span> {lectureSubjectTopic || 'N/A'}</div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingStudents || loadingPreviousAttendance ? (
                                <div className="p-6 flex items-center justify-center space-x-2"><Loader2 className="h-5 w-5 animate-spin" /> <span>{loadingStudents ? 'Loading students...' : 'Checking for previous records...'}</span></div>
                            ) : filteredStudentsToDisplay.length > 0 ? (
                                <>
                                <div className="bg-muted/30 p-3 flex justify-between items-center text-sm font-medium">
                                    <div>Class Strength: <span className="text-primary">{filteredStudentsToDisplay.length}</span></div>
                                    <div>Total Present: <span className="text-green-600">{totalPresentStudents}</span></div>
                                </div>
                                <div className="overflow-x-auto">
                                    <Table className="min-w-full">
                                        <TableHeader>
                                            <TableRow className="bg-muted/10">
                                                <TableHead className="w-[80px] px-3 py-2 text-center border">Sr. No.</TableHead>
                                                <TableHead className="w-[150px] px-3 py-2 border">Roll No.</TableHead>
                                                <TableHead className="min-w-[200px] px-3 py-2 border">Name of Student</TableHead>
                                                <TableHead className="w-[120px] px-3 py-2 text-center border">
                                                    <div className="flex items-center justify-center">
                                                        <Checkbox id="selectAll" checked={selectAllChecked} onCheckedChange={handleSelectAllChange} aria-label="Select all students" />
                                                    </div>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredStudentsToDisplay.map((student, index) => (
                                                <TableRow key={student.userId}>
                                                    <TableCell className="px-3 py-2 text-center border">{index + 1}</TableCell>
                                                    <TableCell className="px-3 py-2 border">{student.studentIdNumber}</TableCell>
                                                    <TableCell className="px-3 py-2 border">{student.name}</TableCell>
                                                    <TableCell className="px-3 py-2 text-center border">
                                                        <div className="flex items-center justify-center">
                                                            <Checkbox id={`attendance-${student.userId}`} checked={attendanceStatus[student.userId] === true} onCheckedChange={(checked) => handleStatusChange(student.userId, checked as boolean)} aria-label={`Mark ${student.name} attendance`} />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="p-4 flex justify-end border-t">
                                    <Button onClick={handleSubmitAttendance} disabled={isSubmitting || !allStudentsHaveDefinedStatus || !lectureSubjectTopic.trim()}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isEditing ? 'Update Attendance' : 'Submit Attendance'}
                                    </Button>
                                </div>
                                </>
                            ) : (
                                <p className="text-muted-foreground text-center p-6">{currentStudents.length === 0 && !loadingClassrooms && !loadingStudents ? "No students found in this classroom." : !loadingClassrooms && !loadingStudents ? "No students match the current batch filter." : "Select a classroom to load students."}</p>
                            )}
                        </CardContent>
                    </Card>
                )}
              </TabsContent>

              <TabsContent value="reports" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>View Attendance Reports</CardTitle>
                        <CardDescription>Select a classroom and date range to view records and generate reports.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <Label htmlFor="classroom-report">Classroom</Label>
                                {loadingClassrooms ? <Skeleton className="h-10 w-full" /> : (
                                    <Select value={selectedClassroomId} onValueChange={setSelectedClassroomId} disabled={classrooms.length === 0}>
                                        <SelectTrigger id="classroom-report"><SelectValue placeholder={classrooms.length > 0 ? "Choose a classroom" : "No classrooms"} /></SelectTrigger>
                                        <SelectContent>{classrooms.map(cr => (<SelectItem key={cr.id} value={cr.id}>{cr.name} ({cr.subject})</SelectItem>))}</SelectContent>
                                    </Select>)}
                            </div>
                             <div>
                                <Label htmlFor="startDate">Start Date</Label>
                                <Popover><PopoverTrigger asChild><Button id="startDate" variant={"outline"} className={cn("w-full justify-start text-left font-normal",!startDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{startDate && isValid(startDate) ? format(startDate, "PPP") : <span>Pick start date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent></Popover>
                            </div>
                            <div>
                                <Label htmlFor="endDate">End Date</Label>
                                <Popover><PopoverTrigger asChild><Button id="endDate" variant={"outline"} className={cn("w-full justify-start text-left font-normal",!endDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{endDate && isValid(endDate) ? format(endDate, "PPP") : <span>Pick end date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus /></PopoverContent></Popover>
                            </div>
                        </div>
                        <div className="flex justify-end">
                             <Button onClick={handleViewRecords} disabled={isFetchingRecords || !selectedClassroomId || !startDate || !endDate} className="w-full sm:w-auto">{isFetchingRecords ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}View Records</Button>
                        </div>
                         {isFetchingRecords && (
                            <div className="flex items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="ml-2">Fetching records...</span></div>
                        )}
                        
                        {!isFetchingRecords && reportRecords.length > 0 && (
                            <>
                            <Card className="mt-6 border-destructive">
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <CardTitle className="flex items-center gap-2 text-destructive mb-2 sm:mb-0">
                                            <AlertTriangle /> Low Attendance Report
                                        </CardTitle>
                                        <Button variant="secondary" size="sm" onClick={handleDownloadDefaulterReport} disabled={lowAttendanceStudents.length === 0}><Download className="mr-2 h-4 w-4"/>Download List</Button>
                                    </div>
                                    <CardDescription>
                                        Students with attendance below the set threshold.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4 space-y-2">
                                        <Label htmlFor="threshold">Attendance Threshold: <span className="font-bold text-primary">{attendanceThreshold}%</span></Label>
                                        <div className="flex items-center gap-4">
                                            <Slider
                                                id="threshold"
                                                min={0}
                                                max={100}
                                                step={1}
                                                value={[attendanceThreshold]}
                                                onValueChange={(value) => setAttendanceThreshold(value[0])}
                                                className="flex-1"
                                            />
                                            <Input 
                                                type="number" 
                                                value={attendanceThreshold}
                                                onChange={handleThresholdInputChange}
                                                className="w-20"
                                                min="0" max="100"
                                            />
                                        </div>
                                    </div>
                                    {lowAttendanceStudents.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Student ID</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Total Lectures</TableHead>
                                                <TableHead>Attended</TableHead>
                                                <TableHead className="text-right">Attendance %</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {lowAttendanceStudents.map(student => (
                                                <TableRow key={student.studentId}>
                                                    <TableCell>{student.studentIdNumber}</TableCell>
                                                    <TableCell>{student.name}</TableCell>
                                                    <TableCell>{student.totalLectures}</TableCell>
                                                    <TableCell>{student.attendedLectures}</TableCell>
                                                    <TableCell className="text-right font-bold">{student.percentage.toFixed(2)}%</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-4">No students are below the {attendanceThreshold}% threshold.</p>
                                    )}
                                </CardContent>
                            </Card>
                            
                            <Card className="mt-6">
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <CardTitle>Detailed Daily Records</CardTitle>
                                        <Button variant="outline" size="sm" onClick={handleDownloadReport}><Download className="mr-2 h-4 w-4"/>Download Full Report</Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full space-y-2">
                                        {groupedReportRecords.map((dateGroup, index) => (
                                            <AccordionItem value={`date-${index}`} key={dateGroup.date} className="border rounded-lg px-4 bg-muted/20">
                                                <AccordionTrigger className="hover:no-underline">
                                                    <div className="text-left">
                                                        <span className="font-semibold text-primary">{format(new Date(dateGroup.date), 'PPP')}</span>
                                                        <span className="text-sm text-muted-foreground ml-4">{dateGroup.lectures.length} lecture(s) recorded</span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-4 pt-2">
                                                        {dateGroup.lectures.map((lecture, lectureIndex) => (
                                                            <div key={lecture.lectureName + lectureIndex} className="border rounded-md p-4 bg-background">
                                                                <div className="mb-2">
                                                                    <h4 className="font-semibold">{lecture.lectureName}</h4>
                                                                    <p className="text-sm text-muted-foreground">Marked by: {lecture.facultyName}</p>
                                                                </div>
                                                                <div className="overflow-x-auto border rounded-md">
                                                                    <Table>
                                                                        <TableHeader>
                                                                            <TableRow>
                                                                                <TableHead>Student Name</TableHead>
                                                                                <TableHead>Roll No.</TableHead>
                                                                                <TableHead>Status</TableHead>
                                                                                <TableHead>Batch</TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {lecture.records.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || '')).map((record: LectureAttendanceRecord) => (
                                                                                <TableRow key={record.id}>
                                                                                    <TableCell>{record.studentName}</TableCell>
                                                                                    <TableCell>{record.studentIdNumber || 'N/A'}</TableCell>
                                                                                    <TableCell className={cn(record.status === 'present' ? 'text-green-600' : 'text-red-600', 'font-medium')}>{record.status.charAt(0).toUpperCase() + record.status.slice(1)}</TableCell>
                                                                                    <TableCell>{record.batch || 'N/A'}</TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                            </>
                        )}

                        {!isFetchingRecords && reportRecords.length === 0 && (
                            <div className="text-center text-muted-foreground pt-6">
                                <p>No records to display. Select a classroom and date range, then click "View Records".</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
        </div>
    </>
  );
}

    