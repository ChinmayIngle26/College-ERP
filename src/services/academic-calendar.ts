/**
 * Represents an academic event with a date and description.
 */
export interface AcademicEvent {
  /**
   * The date of the event.
   */
  date: string;
  /**
   * A description of the event.
   */
  description: string;
}

/**
 * Asynchronously retrieves the academic calendar events.
 *
 * @returns A promise that resolves to an array of AcademicEvent objects.
 */
export async function getAcademicCalendar(): Promise<AcademicEvent[]> {
  // TODO: Implement this by calling an API.

  return [
    {
      date: '2024-09-02',
      description: 'Labor Day (Holiday)',
    },
    {
      date: '2024-10-14',
      description: 'Fall Break',
    },
    {
      date: '2024-11-28',
      description: 'Thanksgiving Day (Holiday)',
    },
  ];
}
