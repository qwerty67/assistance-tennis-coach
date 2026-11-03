import { useMutation } from '@tanstack/react-query';
import { sendOrQueue } from '@/shared/services/offline/outbox';
import { invalidateOperational } from '@/shared/services/queryClient';
import type { AbsenceReason, AttendanceStatus } from '@/shared/types/api';
import { uuid } from '@/shared/utils/id';

export interface AttendanceRecord { student_id: string; status: AttendanceStatus; absence_reason?: AbsenceReason | null; note?: string | null; is_chargeable?: boolean | null }

/** Attendance goes through the offline outbox: never lost on a weak connection at the court. */
export const attendanceApi = {
  bulk: (session_id: string, records: AttendanceRecord[]) =>
    sendOrQueue<{ status: string }>('post', '/attendance/bulk', { session_id, records, complete_session: true, client_mutation_id: uuid() }),
};

export const useBulkAttendance = () =>
  useMutation({ mutationFn: ({ sessionId, records }: { sessionId: string; records: AttendanceRecord[] }) => attendanceApi.bulk(sessionId, records), onSuccess: invalidateOperational });
