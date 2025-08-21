'use client'; // Required for Recharts

import type { AttendanceRecord } from '@/services/attendance';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO, getMonth } from 'date-fns';

interface AttendanceOverviewCardProps {
  attendanceRecords: AttendanceRecord[];
}

// Process data to get monthly attendance counts
const processAttendanceData = (records: AttendanceRecord[]) => {
  const monthlyData: { [key: number]: { name: string; present: number; absent: number; total: number } } = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  records.forEach(record => {
    const monthIndex = getMonth(parseISO(record.date));
    if (!monthlyData[monthIndex]) {
      monthlyData[monthIndex] = { name: monthNames[monthIndex], present: 0, absent: 0, total: 0 };
    }
    monthlyData[monthIndex].total++;
    if (record.status === 'present') {
      monthlyData[monthIndex].present++;
    } else {
       monthlyData[monthIndex].absent++;
    }
  });

   // Calculate percentage or just use present count? Screenshot shows count.
   // For the bar chart, let's use the count of present days per month.
   const chartData = monthNames.map((name, index) => ({
     name: name,
     // Use present count for the bar height as in the screenshot
     attendance: monthlyData[index]?.present || 0,
     // Optional: include absent and total for tooltip
     absent: monthlyData[index]?.absent || 0,
     total: monthlyData[index]?.total || 0,
   }));


  // Filter to show only months with data or a specific range (e.g., last 6 months)
  // Screenshot shows Jan-Jun, let's mimic that for now if data exists
  const relevantMonths = chartData.slice(0, 6); // Show Jan-Jun

  return relevantMonths; // Returning only data for Jan-Jun
};


export function AttendanceOverviewCard({ attendanceRecords }: AttendanceOverviewCardProps) {
  const chartData = processAttendanceData(attendanceRecords);
  const hasData = chartData.some(d => d.attendance > 0);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>Attendance Overview</CardTitle>
         {/* Optional: Add description if needed */}
         {/* <CardDescription>Monthly attendance summary</CardDescription> */}
      </CardHeader>
      <CardContent className="h-64 w-full pl-0 pr-4"> {/* Adjusted padding for axis labels */}
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 0, // Reduced right margin
                left: -20, // Negative margin to pull Y-axis labels left
                bottom: 5,
              }}
              barCategoryGap="20%" // Adjust gap between bars
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                fontSize={12}
                padding={{ left: 10, right: 10 }} // Padding for X-axis labels
              />
              <YAxis
                 axisLine={false}
                 tickLine={false}
                 fontSize={12}
                 width={40} // Adjust width to fit labels
               />
              <Tooltip
                 cursor={{ fill: 'hsl(var(--muted))' }}
                 contentStyle={{
                   backgroundColor: 'hsl(var(--background))',
                   borderColor: 'hsl(var(--border))',
                   borderRadius: 'var(--radius)',
                   fontSize: '0.8rem', // Smaller tooltip font
                 }}
                 itemStyle={{ color: 'hsl(var(--foreground))' }}
                 formatter={(value, name, props) => [`${value} days present`, null]} // Customize tooltip content
               />
              <Bar
                dataKey="attendance"
                radius={[4, 4, 0, 0]} // Rounded top corners
              >
                 {/* Apply color based on theme variable */}
                 {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="hsl(var(--chart-1))" />
                 ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-muted-foreground">No attendance data available for this period.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
