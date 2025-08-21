import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';

// Mock data for appointments - replace with actual data fetching
const upcomingAppointments = [
  { id: 'appt1', date: '2024-09-10', time: '10:00 AM', with: 'Prof. Smith', reason: 'Project Discussion' },
  { id: 'appt2', date: '2024-09-12', time: '02:30 PM', with: 'Advisor Jones', reason: 'Course Selection' },
];

const pastAppointments = [
    { id: 'appt3', date: '2024-08-15', time: '11:00 AM', with: 'Career Services', reason: 'Resume Review' },
];

export default function AppointmentsPage() {
  return (
    <>
      <MainHeader />
      <div className="space-y-6">
         <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Appointments
          </h2>
           <Button>
             <CalendarPlus className="mr-2 h-4 w-4" /> Schedule New Appointment
           </Button>
         </div>


        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <ul className="space-y-3">
                {upcomingAppointments.map((appt) => (
                  <li key={appt.id} className="rounded-md border p-3">
                    <p><strong>Date:</strong> {appt.date} at {appt.time}</p>
                    <p><strong>With:</strong> {appt.with}</p>
                    <p><strong>Reason:</strong> {appt.reason}</p>
                    {/* Add cancel/reschedule options */}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No upcoming appointments scheduled.</p>
            )}
          </CardContent>
        </Card>

        {/* Past Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Past Appointments</CardTitle>
          </CardHeader>
          <CardContent>
             {pastAppointments.length > 0 ? (
               <ul className="space-y-3">
                 {pastAppointments.map((appt) => (
                   <li key={appt.id} className="rounded-md border p-3 text-muted-foreground">
                     <p><strong>Date:</strong> {appt.date} at {appt.time}</p>
                     <p><strong>With:</strong> {appt.with}</p>
                     <p><strong>Reason:</strong> {appt.reason}</p>
                   </li>
                 ))}
               </ul>
             ) : (
               <p className="text-muted-foreground">No past appointment history.</p>
             )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
