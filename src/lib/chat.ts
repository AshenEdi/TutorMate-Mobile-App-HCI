import { supabase } from "../../lib/supabase";

/**
 * Gets an existing conversation between a student and tutor, or creates one if it doesn't exist.
 * Handles race conditions via UNIQUE constraints on (student_id, tutor_id).
 */
export async function getOrCreateConversation(studentId: string, tutorId: string): Promise<string | null> {
  if (!studentId || !tutorId) return null;

  try {
    // 1. Try to find existing conversation
    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('id')
      .eq('student_id', studentId)
      .eq('tutor_id', tutorId)
      .maybeSingle();

    if (existing && existing.id) {
      return existing.id;
    }

    // 2. If not found, attempt to insert a new conversation thread
    const { data: newConv, error: insertError } = await supabase
      .from('conversations')
      .insert({ student_id: studentId, tutor_id: tutorId })
      .select('id')
      .maybeSingle();

    if (newConv && newConv.id) {
      return newConv.id;
    }

    // 3. Race condition handling: if insertion collided with unique constraint (error code 23505), fetch again.
    if (insertError && (insertError.code === '23505' || insertError.message?.includes('duplicate key'))) { 
      const { data: raceExisting } = await supabase
        .from('conversations')
        .select('id')
        .eq('student_id', studentId)
        .eq('tutor_id', tutorId)
        .maybeSingle();
        
      if (raceExisting && raceExisting.id) {
        return raceExisting.id;
      }
    }
    
    if (insertError) {
      console.warn("Could not insert conversation:", insertError.message);
    }
    return null;
  } catch (error) {
    console.error("Error in getOrCreateConversation:", error);
    return null;
  }
}

/**
 * Gets or creates an admin conversation with a student or tutor for moderation/support.
 */
export async function getOrCreateAdminConversation(
  adminId: string,
  targetUserId: string,
  targetRole: "student" | "tutor" = "student"
): Promise<string | null> {
  if (!adminId || !targetUserId) return null;

  try {
    const studentId = targetRole === "student" ? targetUserId : adminId;
    const tutorId = targetRole === "tutor" ? targetUserId : adminId;

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(student_id.eq.${studentId},tutor_id.eq.${tutorId}),and(student_id.eq.${adminId},tutor_id.eq.${targetUserId}),and(student_id.eq.${targetUserId},tutor_id.eq.${adminId})`)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      return existing.id;
    }

    const { data: newConv, error: insertErr } = await supabase
      .from("conversations")
      .insert({
        student_id: studentId,
        tutor_id: tutorId,
        admin_id: adminId,
      })
      .select("id")
      .maybeSingle();

    if (newConv?.id) {
      return newConv.id;
    }

    if (insertErr) {
      console.warn("Admin conversation insert note:", insertErr.message);
    }
    return null;
  } catch (error) {
    console.error("Error in getOrCreateAdminConversation:", error);
    return null;
  }
}
