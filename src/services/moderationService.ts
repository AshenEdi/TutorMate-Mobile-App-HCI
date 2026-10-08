import { supabase } from '../../lib/supabase';

export interface SafetyCheckResult {
  flagged: boolean;
  type: 'payment_bypass' | 'safety' | 'clean';
  matches: string[];
  calloutDescription?: string;
}

// Regex patterns for detecting phone numbers, emails, and off-platform payment services
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PAYMENT_KEYWORDS = [
  'venmo',
  'cashapp',
  'cash app',
  'zelle',
  'paypal',
  'wire transfer',
  'whatsapp',
  'telegram',
  'pay offline',
  'direct deposit',
  'crypto',
  'bitcoin',
];

export function inspectMessageSafety(text: string): SafetyCheckResult {
  if (!text) {
    return { flagged: false, type: 'clean', matches: [] };
  }

  const matches: string[] = [];
  const lower = text.toLowerCase();

  // 1. Check phone numbers
  const phoneMatches = text.match(PHONE_REGEX);
  if (phoneMatches) {
    matches.push(...phoneMatches.map((m) => `Phone: ${m}`));
  }

  // 2. Check emails
  const emailMatches = text.match(EMAIL_REGEX);
  if (emailMatches) {
    matches.push(...emailMatches.map((m) => `Email: ${m}`));
  }

  // 3. Check payment keywords
  for (const kw of PAYMENT_KEYWORDS) {
    if (lower.includes(kw)) {
      matches.push(`Keyword: ${kw}`);
    }
  }

  if (matches.length > 0) {
    const isPayment = matches.some(
      (m) =>
        m.includes('Keyword') ||
        m.includes('venmo') ||
        m.includes('zelle') ||
        m.includes('paypal') ||
        m.includes('cashapp')
    );
    const type = isPayment ? 'payment_bypass' : 'safety';
    const calloutDescription = `Off-platform contact/payment info [ ${matches.join(', ')} ] detected.`;

    return {
      flagged: true,
      type,
      matches,
      calloutDescription,
    };
  }

  return { flagged: false, type: 'clean', matches: [] };
}

export async function logModerationFlag(params: {
  flaggedUserId: string;
  flaggedUserName?: string;
  counterpartId?: string;
  subject?: string;
  flagType: 'payment_bypass' | 'harassment' | 'safety' | 'inactivity' | 'technical';
  messageContent: string;
  calloutDescription: string;
  priority?: 'urgent' | 'high' | 'medium';
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('moderation_flags').insert({
      flagged_user_id: params.flaggedUserId,
      flagged_user_name: params.flaggedUserName,
      counterpart_id: params.counterpartId,
      subject: params.subject || 'Safety Filter',
      flag_type: params.flagType,
      message_content: params.messageContent,
      callout_description: params.calloutDescription,
      priority: params.priority || 'high',
      status: 'active',
    });

    if (error) {
      console.warn('[moderationService] log flag warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[moderationService] error logging flag:', err);
    return false;
  }
}
