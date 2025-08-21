import { MainHeader } from '@/components/layout/main-header';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Vote } from 'lucide-react';

// Mock data for elections - replace with actual data fetching
const activeElections = [
  { id: 'elec1', title: 'Student Body President Election', description: 'Vote for the next president.', closingDate: '2024-09-15' },
  { id: 'elec2', title: 'Engineering Club Lead Election', description: 'Choose the new club leader.', closingDate: '2024-09-20' },
];

const pastElections = [
    { id: 'elec3', title: 'Library Committee Representative', description: 'Results are available.', closingDate: '2024-05-10', result: 'Jane Smith Elected' },
];

export default function VotingSystemPage() {
  return (
    <>
      <MainHeader />
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Voting System
        </h2>

        {/* Active Elections */}
        <Card>
          <CardHeader>
            <CardTitle>Active Elections</CardTitle>
            <CardDescription>Cast your vote before the closing date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeElections.length > 0 ? (
              activeElections.map((election) => (
                <Card key={election.id} className="flex flex-col items-start justify-between gap-2 p-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold">{election.title}</h3>
                    <p className="text-sm text-muted-foreground">{election.description}</p>
                    <p className="text-xs text-muted-foreground">Closes on: {election.closingDate}</p>
                  </div>
                  <Button size="sm">
                      <Vote className="mr-2 h-4 w-4" /> Vote Now
                  </Button>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground">No active elections at the moment.</p>
            )}
          </CardContent>
        </Card>

        {/* Past Elections */}
        <Card>
          <CardHeader>
            <CardTitle>Past Elections</CardTitle>
             <CardDescription>View the results of completed elections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {pastElections.length > 0 ? (
                pastElections.map((election) => (
                    <Card key={election.id} className="p-4 bg-muted">
                         <h3 className="font-semibold">{election.title}</h3>
                         <p className="text-sm text-muted-foreground">{election.description}</p>
                         <p className="text-sm text-primary font-medium mt-1">Result: {election.result}</p>
                         <p className="text-xs text-muted-foreground mt-1">Closed on: {election.closingDate}</p>
                    </Card>
                ))
             ) : (
               <p className="text-muted-foreground">No past election history.</p>
             )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
