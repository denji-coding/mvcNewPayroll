

# Plan: Fix Attendance Terminal and Attendance Page

## Issues Identified

### Issue 1: Attendance records not showing on the Attendance page
**Root cause**: Two problems working together:
- **Timezone mismatch**: The edge function calculates `today` using UTC (`now.toISOString().split('T')[0]`). In the Philippines (UTC+8), this means attendance recorded between 12:00 AM and 7:59 AM Philippine time gets saved under the *previous day's* date. Meanwhile, the Attendance page uses the browser's local date. So the dates don't match.
- **Realtime may not be enabled**: The `attendance` table may not be added to the `supabase_realtime` publication, so the real-time subscription in `useAttendance.ts` might not fire.

### Issue 2: Attendance saved under past dates
**Root cause**: Same timezone bug. The edge function uses `new Date().toISOString().split('T')[0]` which is UTC-based. Additionally, the `timestamp` parameter in the request body is accepted without validation, allowing attendance to be recorded for any arbitrary date.

## Changes

### 1. Fix edge function timezone handling (`supabase/functions/rfid-attendance/index.ts`)
- Calculate `today` using Philippine timezone (UTC+8) instead of UTC
- Remove the `timestamp` parameter from the request body to prevent arbitrary date submissions -- attendance should always use the server's current time
- Add explicit validation: only record attendance for the current date (Philippine time)

```text
Before:  const now = timestamp ? new Date(timestamp) : new Date();
         const today = now.toISOString().split('T')[0];

After:   const now = new Date();
         // Use Philippine timezone for date calculation
         const phFormatter = new Intl.DateTimeFormat('en-CA', { 
           timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' 
         });
         const today = phFormatter.format(now); // "2026-02-25" format
```

### 2. Enable realtime for the attendance table (Database migration)
- Add the `attendance` table to the `supabase_realtime` publication so that real-time subscriptions work

### 3. Improve Attendance page refresh (`src/pages/Attendance.tsx`)
- No code changes needed here since the realtime subscription in `useAttendance.ts` already handles invalidation. Once realtime is enabled on the table, it will work.

### 4. Improve terminal-side refresh (`src/pages/AttendanceTerminal.tsx`)
- The terminal already refetches on successful result, which is correct. No changes needed.

## Summary of Files to Edit

| File | Changes |
|------|---------|
| `supabase/functions/rfid-attendance/index.ts` | Fix timezone to Asia/Manila, remove `timestamp` param, validate current-date-only |
| Database migration | `ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance` |

## Implementation Order
1. Database migration (enable realtime)
2. Update edge function (timezone fix + remove timestamp param)

