import { supabase } from '../../lib/supabase';
import { createNotification } from './notificationService';

export interface DisputeRecord {
  id: string;
  code: string;
  booking_id: string | null;
  booking_ref: string | null;
  student_id: string;
  tutor_id: string;
  student_name: string;
  tutor_name: string;
  subject: string;
  priority: 'urgent' | 'high' | 'technical' | 'medium';
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  escrow_amount: number;
  reason: string;
  category: string;
  student_statement: string | null;
  student_attachment_url: string | null;
  tutor_statement: string | null;
  system_audit_log: Record<string, unknown>;
  decision: 'full_refund' | 'reschedule' | 'partial_refund' | 'dismiss' | null;
  refund_amount: number;
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  auto_escalate_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DisputeResolutionParams {
  disputeId: string;
  decision: 'full_refund' | 'reschedule' | 'partial_refund' | 'dismiss';
  refundAmount: number;
  resolutionNotes?: string;
  issueTutorStrike?: boolean;
  creditDurationMinutes?: number;
}

export async function createDispute(params: {
  bookingId?: string;
  bookingRef?: string;
  studentId: string;
  tutorId?: string;
  studentName: string;
  tutorName: string;
  subject: string;
  reason: string;
  category?: string;
  studentStatement?: string;
  studentAttachmentUrl?: string;
  escrowAmount?: number;
  priority?: 'urgent' | 'high' | 'technical' | 'medium';
}): Promise<{ data: DisputeRecord | null; error: string | null }> {
  try {
    const validBookingId = params.bookingId && params.bookingId.length > 20 ? params.bookingId : null;
    const validTutorId = params.tutorId && params.tutorId.length > 20 ? params.tutorId : null;
    const validStudentId = params.studentId && params.studentId.length > 20 ? params.studentId : null;

    if (!validStudentId) {
      return { data: null, error: 'Valid student authentication is required to file a dispute.' };
    }

    if (validBookingId) {
      const { data: existing } = await supabase
        .from('disputes')
        .select('id, code')
        .eq('booking_id', validBookingId)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        return { data: null, error: `A dispute (${existing.code}) is already pending for this booking.` };
      }
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `#DIS-${randomSuffix}`;

    const { data, error } = await supabase
      .from('disputes')
      .insert({
        code,
        booking_id: validBookingId,
        booking_ref: params.bookingRef || null,
        student_id: validStudentId,
        tutor_id: validTutorId,
        student_name: params.studentName,
        tutor_name: params.tutorName,
        subject: params.subject,
        priority: params.priority || 'high',
        status: 'pending',
        escrow_amount: params.escrowAmount ?? 45,
        reason: params.reason,
        category: params.category || 'Session Quality',
        student_statement: params.studentStatement || params.reason,
        student_attachment_url: params.studentAttachmentUrl || null,
        system_audit_log: {
          submitted_at: new Date().toISOString(),
          auto_flagged: false,
          client_platform: 'TutorMate Mobile',
        },
      })
      .select('*')
      .single();

    if (error) {
      console.error('[disputeService] error inserting dispute:', error.message, error.details);
      return { data: null, error: error.message };
    }

    // Notify tutor about the newly filed dispute
    if (validTutorId) {
      await createNotification({
        userId: validTutorId,
        role: 'tutor',
        type: 'dispute',
        title: 'Action Required: Dispute Filed',
        description: `Student ${params.studentName} filed dispute ${code} for ${params.subject}. Please submit your response.`,
        highlightText: code,
        category: 'Reminders',
        referenceId: data.id,
      });
    }

    // Notify student confirmation
    await createNotification({
      userId: params.studentId,
      role: 'student',
      type: 'dispute',
      title: 'Dispute Under Review',
      description: `Your dispute ${code} for ${params.subject} has been received by Admin Moderation.`,
      highlightText: code,
      category: 'Reminders',
      referenceId: data.id,
    });

    return { data: data as DisputeRecord, error: null };
  } catch (err: any) {
    console.error('[disputeService] unexpected error creating dispute:', err);
    return { data: null, error: err?.message || 'Failed to submit dispute' };
  }
}

export async function getDisputeById(id: string): Promise<DisputeRecord | null> {
  try {
    const { data, error } = await supabase
      .from('disputes')
      .select('*')
      .or(`id.eq.${id},code.eq.${id}`)
      .single();

    if (error || !data) {
      console.warn('[disputeService] dispute not found by id:', id);
      return null;
    }
    return data as DisputeRecord;
  } catch (err) {
    console.warn('[disputeService] error fetching dispute by id:', err);
    return null;
  }
}

export async function getDisputesForStudent(studentId: string): Promise<DisputeRecord[]> {
  try {
    const { data, error } = await supabase
      .from('disputes')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data ?? []) as DisputeRecord[];
  } catch (err) {
    return [];
  }
}

export async function getDisputesForTutor(tutorId: string): Promise<DisputeRecord[]> {
  try {
    const { data, error } = await supabase
      .from('disputes')
      .select('*')
      .eq('tutor_id', tutorId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data ?? []) as DisputeRecord[];
  } catch (err) {
    return [];
  }
}

export async function submitTutorDisputeResponse(
  disputeId: string,
  tutorStatement: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('disputes')
      .update({
        tutor_statement: tutorStatement,
        status: 'investigating',
        updated_at: new Date().toISOString(),
      })
      .eq('id', disputeId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to submit response' };
  }
}

export async function resolveDispute(
  params: DisputeResolutionParams
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    const dispute = await getDisputeById(params.disputeId);
    if (!dispute) {
      return { success: false, error: 'Dispute record not found.' };
    }

    // Verify if admin user ID exists in profiles to satisfy any foreign key constraints
    let validAdminId: string | null = null;
    if (adminUser?.id) {
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', adminUser.id)
        .maybeSingle();
      if (profileCheck?.id) {
        validAdminId = profileCheck.id;
      }
    }

    const isResolved = params.decision !== 'dismiss';
    const newStatus = isResolved ? 'resolved' : 'dismissed';
    const resolvedAt = new Date().toISOString();

    // 1. Update dispute table
    const { error: updateError } = await supabase
      .from('disputes')
      .update({
        status: newStatus,
        decision: params.decision,
        refund_amount: params.refundAmount,
        resolution_notes: params.resolutionNotes || null,
        resolved_by: validAdminId,
        resolved_at: resolvedAt,
        updated_at: resolvedAt,
      })
      .eq('id', dispute.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 2. Handle specific resolution side-effects:
    // A) Reschedule session credit
    if (params.decision === 'reschedule') {
      await supabase.from('session_credits').insert({
        student_id: dispute.student_id,
        dispute_id: dispute.id,
        duration_minutes: params.creditDurationMinutes || 60,
        status: 'available',
        notes: `Free reschedule granted for ${dispute.subject} (Case ${dispute.code})`,
      });

      // Increment student's profile session_credits
      const { data: prof } = await supabase.from('profiles').select('session_credits').eq('id', dispute.student_id).single();
      const currentCredits = Number(prof?.session_credits ?? 0);
      await supabase.from('profiles').update({ session_credits: currentCredits + 1 }).eq('id', dispute.student_id);
    }

    // B) Full / Partial Refund to Student Wallet
    if (params.refundAmount > 0) {
      try {
        const { data: studentProf } = await supabase
          .from('profiles')
          .select('wallet_balance')
          .eq('id', dispute.student_id)
          .single();

        const currentBal = Number(studentProf?.wallet_balance ?? 0);
        const updatedBal = currentBal + params.refundAmount;

        await supabase
          .from('profiles')
          .update({ wallet_balance: updatedBal })
          .eq('id', dispute.student_id);

        await supabase.from('wallet_transactions').insert({
          user_id: dispute.student_id,
          amount: params.refundAmount,
          type: 'refund',
          description: `Dispute Resolution Refund (${dispute.code})`,
        });
      } catch (walletErr) {
        console.warn('[disputeService] non-blocking wallet update error:', walletErr);
      }
    }

    // C) Tutor Strike / Moderation Action
    if (params.issueTutorStrike) {
      await supabase.from('moderation_actions').insert({
        user_id: dispute.tutor_id,
        admin_id: validAdminId,
        dispute_id: dispute.id,
        action_type: 'strike',
        reason: `Policy violation strike issued from Dispute ${dispute.code}: ${params.resolutionNotes || 'No-show / grievance confirmed'}`,
        amount: params.refundAmount,
      });

      const { data: tutorProf } = await supabase.from('profiles').select('strikes_count').eq('id', dispute.tutor_id).single();
      const currentStrikes = Number(tutorProf?.strikes_count ?? 0) + 1;
      const newStanding = currentStrikes >= 3 ? 'suspended' : currentStrikes >= 1 ? 'warning' : 'good_standing';

      await supabase.from('profiles').update({
        strikes_count: currentStrikes,
        standing: newStanding,
      }).eq('id', dispute.tutor_id);
    }

    // 3. Dispatch in-app notifications
    // To Student:
    let studentDesc = `Admin has resolved dispute ${dispute.code}.`;
    if (params.decision === 'full_refund') {
      studentDesc = `Full refund of $${params.refundAmount.toFixed(2)} has been credited to your account for Case ${dispute.code}.`;
    } else if (params.decision === 'partial_refund') {
      studentDesc = `Partial refund of $${params.refundAmount.toFixed(2)} has been credited for Case ${dispute.code}.`;
    } else if (params.decision === 'reschedule') {
      studentDesc = `A complimentary reschedule credit has been added to your profile for Case ${dispute.code}.`;
    } else if (params.decision === 'dismiss') {
      studentDesc = `Dispute ${dispute.code} was reviewed and dismissed by moderation.`;
    }

    await createNotification({
      userId: dispute.student_id,
      role: 'student',
      type: 'dispute',
      title: 'Dispute Resolved',
      description: studentDesc,
      highlightText: dispute.code,
      category: 'Reminders',
      referenceId: dispute.id,
    });

    // To Tutor:
    let tutorDesc = `Dispute ${dispute.code} has been resolved by Admin.`;
    if (params.issueTutorStrike) {
      tutorDesc = `Dispute ${dispute.code} closed with a formal strike recorded on your profile.`;
    } else if (params.decision === 'dismiss') {
      tutorDesc = `Dispute ${dispute.code} has been dismissed in your favor. Escrow payout released.`;
    }

    await createNotification({
      userId: dispute.tutor_id,
      role: 'tutor',
      type: 'dispute',
      title: 'Dispute Resolution Completed',
      description: tutorDesc,
      highlightText: dispute.code,
      category: 'Reminders',
      referenceId: dispute.id,
    });

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[disputeService] resolution error:', err);
    return { success: false, error: err?.message || 'Failed to resolve dispute' };
  }
}

export async function deleteDispute(
  disputeId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('disputes')
      .delete()
      .eq('id', disputeId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete dispute' };
  }
}

export async function deleteModerationFlag(
  flagId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('moderation_flags')
      .delete()
      .eq('id', flagId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete flag' };
  }
}

