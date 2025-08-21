'use client'; // Required for Recharts

import type { Grade } from '@/services/grades';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface GradesChartCardProps {
  grades: Grade[];
}

// Define colors for grades - adjust as needed to match screenshot/theme
const GRADE_COLORS: { [key: string]: string } = {
  'A': 'hsl(var(--chart-1))', // Teal/Blue
  'B': 'hsl(var(--chart-2))', // Lighter Teal
  'C': 'hsl(var(--chart-3))', // Greenish Teal
  'D': 'hsl(var(--chart-4))', // Yellow
  'F': 'hsl(var(--chart-5))', // Purple/Red
  // Add other grades like A+, B- etc. if needed
};

// Process grades for the donut chart
const processGradeData = (grades: Grade[]) => {
    const gradeCounts: { [key: string]: number } = {};
    grades.forEach(grade => {
        const gradeKey = grade.grade.toUpperCase().charAt(0); // Group by letter grade (A, B, C...)
        gradeCounts[gradeKey] = (gradeCounts[gradeKey] || 0) + 1;
    });

    return Object.entries(gradeCounts).map(([name, value]) => ({
        name: `Grade ${name}`,
        value,
        fill: GRADE_COLORS[name] || 'hsl(var(--muted))', // Fallback color
    }));
};

export function GradesChartCard({ grades }: GradesChartCardProps) {
  const chartData = processGradeData(grades);
  const hasData = chartData.length > 0;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>Grades by Subject</CardTitle> {/* Title matches screenshot */}
        {/* Optional: Add description if needed */}
        {/* <CardDescription>Distribution of grades</CardDescription> */}
      </CardHeader>
      <CardContent className="h-64 w-full"> {/* Ensure height for the chart */}
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={60} // Make it a donut chart
                outerRadius={80}
                fill="#8884d8" // Default fill, overridden by Cell
                paddingAngle={1} // Small gap between segments
                dataKey="value"
                // label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} // Label inside/outside
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} /> // Use processed fill color
                ))}
              </Pie>
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.8rem',
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value, name) => [`${value} subjects`, name]}
              />
               {/* <Legend wrapperStyle={{fontSize: '0.8rem', paddingTop: '10px'}}/> */}
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-muted-foreground">No grade data available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
