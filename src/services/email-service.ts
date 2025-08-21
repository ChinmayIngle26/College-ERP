
'use server';

// This file's content related to Nodemailer has been removed as the
// Leave Application feature (its only consumer) was removed.
// If you re-introduce email sending capabilities, you can re-implement this service.
// You may consider deleting this file and removing Nodemailer from package.json.

export async function sendEmail(mailOptions: any): Promise<void> {
  console.warn('Email sending functionality has been removed. sendEmail was called but did nothing.');
  // throw new Error('Email service is not configured or has been removed.');
  return Promise.resolve();
}
