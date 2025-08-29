
'use client'; // Make this a client component

import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { getGrades } from '@/services/grades';
import { Suspense, useEffect, useState } from 'react'; // Add useEffect, useState
import { useAuth } from '@/context/auth-context'; // Import useAuth
import type { Grade } from '@/services/grades'; // Import Grade type
import { format } from 'date-fns';

function GradesTableLoader() {
   const { user, loading: authLoading } = useAuth(); // Get user and loading state
   const [grades, setGrades] = useState<Grade[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
        if (!authLoading && user) {
            const fetchGrades = async () => {
                setLoading(true);
                setError(null);
                try {
                    const fetchedGrades = await getGrades(user.uid); // Use user.uid
                    setGrades(fetchedGrades);
                } catch (err) {
                    console.error("Failed to fetch grades:", err);
                    setError("Could not load grade data.");
                } finally {
                    setLoading(false);
                }
            };
            fetchGrades();
        } else if (!authLoading && !user) {
            setLoading(false);
            setError("Please sign in to view grades.");
        }
   }, [user, authLoading]);


    if (loading || authLoading) {
      return <Skeleton className="h-72 w-full" />;
    }

    if (error) {
        return <p className="text-center text-destructive">{error}</p>;
    }


  return (
    <Card>
      <CardHeader>
        <CardTitle>My Grades</CardTitle>
      </CardHeader>
      <CardContent>
        {grades.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course / Subject</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell>{grade.courseName}</TableCell>
                  <TableCell className="font-medium">{grade.grade}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                      {format(new Date(grade.updatedAt as Date), 'PP p')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">No grades have been recorded for you yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function GradesPage() {
  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Grades
        </h2>
         <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          <GradesTableLoader />
         </Suspense>
      </div>
    </>
  );
}
