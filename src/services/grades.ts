/**
 * Represents a student's grade for a specific course.
 */
export interface Grade {
  /**
   * The name of the course.
   */
  courseName: string;
  /**
   * The grade the student received in the course.
   */
  grade: string;
}

/**
 * Asynchronously retrieves the grades for a given student.
 *
 * @param studentId The ID of the student.
 * @returns A promise that resolves to an array of Grade objects.
 */
export async function getGrades(studentId: string): Promise<Grade[]> {
  // TODO: Implement this by calling an API.

  return [
    {
      courseName: 'Mathematics',
      grade: 'A',
    },
    {
      courseName: 'History',
      grade: 'B',
    },
    {
      courseName: 'English',
      grade: 'A+',
    },
  ];
}
