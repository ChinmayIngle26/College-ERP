'use client'; // Required for Recharts

import type { Grade } from '@/services/grades';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckCircle, ArrowUp, ArrowDown, Lightbulb, GraduationCap } from 'lucide-react';
import type { GradeAnalysisOutput } from '@/ai/flows/analyze-grades-flow';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface GradesChartCardProps {
  grades: Grade[];
  analysis: GradeAnalysisOutput;
}

export function GradesChartCard({ grades, analysis }: GradesChartCardProps) {
  const hasData = grades.length > 0;
  const recentGrades = [...grades].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Grade Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasData ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* AI Analysis Section */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2"><Lightbulb className="h-4 w-4 text-yellow-500" /> AI Summary</h3>
                <p className="text-sm text-muted-foreground mt-1">{analysis.overallSummary}</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2"><ArrowUp className="h-4 w-4 text-green-500" /> Strengths</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                  {analysis.strengths.length > 0 ? analysis.strengths.map((s, i) => <li key={`strength-${i}`}>{s}</li>) : <li>No specific strengths identified yet.</li>}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2"><ArrowDown className="h-4 w-4 text-red-500" /> Areas for Improvement</h3>
                 <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                  {analysis.areasForImprovement.length > 0 ? analysis.areasForImprovement.map((a, i) => <li key={`improvement-${i}`}>{a}</li>) : <li>Great work! No specific areas for improvement noted.</li>}
                </ul>
              </div>
            </div>

            {/* Recent Grades Table */}
            <div>
              <h3 className="font-semibold text-foreground mb-2">Recent Grades</h3>
              <div className="overflow-hidden rounded-md border">
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentGrades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell className="py-2">{grade.courseName}</TableCell>
                        <TableCell className="text-right font-medium py-2">{grade.grade}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[150px] items-center justify-center">
            <p className="text-center text-muted-foreground">{analysis.overallSummary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
