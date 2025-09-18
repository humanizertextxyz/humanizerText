// Helper function to sanitize email for use as Firestore document ID
export const sanitizeEmailForDocId = (email: string): string => {
  const sanitized = email.replace(/[\.#$\[\]@]/g, (match) => {
    if (match === '@') return '_at_';
    return '_';
  });
  
  return sanitized;
};

// Test function to verify email sanitization
export const testEmailSanitization = (email: string): void => {
  console.log(`Testing email sanitization for: ${email}`);
  const result = sanitizeEmailForDocId(email);
  console.log(`Result: ${result}`);
}; 