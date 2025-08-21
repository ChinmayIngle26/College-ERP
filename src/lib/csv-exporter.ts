
'use client';

/**
 * Escapes a value for CSV format. If the value contains a comma, double quote, or newline,
 * it will be enclosed in double quotes. Existing double quotes will be escaped by doubling them.
 * @param value The value to escape.
 * @returns The escaped string for CSV.
 */
function escapeCsvValue(value: any): string {
    const stringValue = String(value ?? ''); // Handle null/undefined by treating them as empty strings
    if (/[",\n\r]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

/**
 * Generates and triggers the download of a CSV file from an array of objects.
 * @param data An array of objects to be converted into CSV rows.
 * @param filename The desired name of the output file (e.g., "report.csv").
 */
export function exportDataToCsv<T extends Record<string, any>>(data: T[], filename: string): void {
    if (!data || data.length === 0) {
        console.warn("No data provided to export to CSV.");
        return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.map(escapeCsvValue).join(','), // Header row
        ...data.map(row =>
            headers.map(header => escapeCsvValue(row[header])).join(',')
        )
    ];

    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
