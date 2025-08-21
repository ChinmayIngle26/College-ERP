/**
 * Represents a single announcement.
 */
export interface Announcement {
  id: string;
  /**
   * The date the announcement was published.
   */
  date: string;
  /**
   * The title of the announcement.
   */
  title: string;
  /**
   * The main content/body of the announcement.
   */
  content: string;
}

/**
 * Asynchronously retrieves recent announcements.
 *
 * @returns A promise that resolves to an array of Announcement objects.
 */
export async function getAnnouncements(): Promise<Announcement[]> {
  // TODO: Implement this by calling an API.

  // Returning mock data similar to the screenshot's Lorem Ipsum content
  return [
    {
      id: '1',
      date: '2024-08-28',
      title: 'Recent Announcement',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    },
    {
      id: '2',
      date: '2024-08-27',
      title: 'Recent Announcement',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    },
    {
        id: '3',
        date: '2024-08-26',
        title: 'Recent Announcement',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      },
      {
        id: '4',
        date: '2024-08-25',
        title: 'Recent Announcement',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      },
      {
        id: '5',
        date: '2024-08-24',
        title: 'Recent Announcement',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      },
  ];
}
