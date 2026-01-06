/**
 * Error handling utility that maps database errors to user-friendly messages
 * while logging technical details to console for debugging.
 */

// Common error patterns and their user-friendly messages
const ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  // Unique constraint violations
  { pattern: /duplicate key.*employees_email_key/i, message: 'This email address is already in use' },
  { pattern: /duplicate key.*employees_employee_id_key/i, message: 'This employee ID is already in use' },
  { pattern: /duplicate key.*employees_rfid_card_number_key/i, message: 'This RFID card is already assigned' },
  { pattern: /duplicate key.*branches_code_key/i, message: 'This branch code is already in use' },
  { pattern: /duplicate key value/i, message: 'This record already exists' },
  
  // Foreign key violations
  { pattern: /violates foreign key constraint/i, message: 'Cannot complete this action due to related records' },
  
  // RLS policy violations
  { pattern: /row-level security/i, message: 'You do not have permission to perform this action' },
  { pattern: /new row violates row-level security policy/i, message: 'You do not have permission to create this record' },
  
  // Not found errors
  { pattern: /PGRST116/i, message: 'Record not found' },
  { pattern: /no rows returned/i, message: 'Record not found' },
  
  // Authentication errors
  { pattern: /JWT expired/i, message: 'Your session has expired. Please log in again' },
  { pattern: /invalid.*token/i, message: 'Authentication error. Please log in again' },
  { pattern: /not authenticated/i, message: 'Please log in to continue' },
  
  // Authorization errors
  { pattern: /permission denied/i, message: 'You do not have permission to perform this action' },
  { pattern: /only hr/i, message: 'This action requires HR administrator access' },
  
  // Network errors
  { pattern: /network/i, message: 'Connection error. Please check your internet connection' },
  { pattern: /fetch failed/i, message: 'Unable to connect to the server' },
  { pattern: /timeout/i, message: 'Request timed out. Please try again' },
  
  // Data type errors
  { pattern: /invalid input syntax/i, message: 'Invalid data format provided' },
  { pattern: /value too long/i, message: 'The entered value is too long' },
  { pattern: /null value in column/i, message: 'A required field is missing' },
  
  // Validation errors from edge functions
  { pattern: /missing authorization/i, message: 'Please log in to continue' },
  { pattern: /invalid or expired token/i, message: 'Your session has expired. Please log in again' },
];

/**
 * Maps a database/API error to a user-friendly message.
 * Logs the original error to console for debugging.
 * 
 * @param error - The original error object
 * @param context - Optional context string for logging (e.g., 'creating employee')
 * @returns A user-friendly error message
 */
export function mapErrorToUserMessage(error: unknown, context?: string): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Log the full error for debugging (only in development or for console access)
  console.error(`Error${context ? ` (${context})` : ''}:`, error);
  
  // Check against known patterns
  for (const { pattern, message } of ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return message;
    }
  }
  
  // Default fallback message
  return 'An unexpected error occurred. Please try again';
}

/**
 * Gets a safe error message for display to users.
 * Use this in onError callbacks for mutations.
 * 
 * @param error - The error object from mutation
 * @param fallbackMessage - A context-specific fallback message
 * @returns A user-friendly error message
 */
export function getSafeErrorMessage(error: unknown, fallbackMessage: string): string {
  const mappedMessage = mapErrorToUserMessage(error);
  
  // If we got the generic fallback, use the provided context-specific one
  if (mappedMessage === 'An unexpected error occurred. Please try again') {
    return fallbackMessage;
  }
  
  return mappedMessage;
}
