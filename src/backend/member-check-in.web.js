import { Permissions, webMethod } from 'wix-web-module';
import { currentMember } from 'wix-members-backend';
import { saveDailyCheckInForMember } from './http-functions';

function cleanText(value, field, max = 80, required = true) {
  if (typeof value !== 'string') throw new Error(`invalid_${field}`);
  const result = value.trim();
  if ((required && !result) || result.length > max) throw new Error(`invalid_${field}`);
  return result;
}

export const saveDailyCheckIn = webMethod(Permissions.SiteMember, async (input = {}) => {
  try {
    const member = await currentMember.getMember();
    if (!member?._id) throw new Error('authenticated_member_required');
    const entry = {
      submissionId: cleanText(input.submissionId, 'submission_id', 80),
      emotion: cleanText(input.emotion, 'emotion'),
      feeling: cleanText(input.feeling || '', 'feeling', 80, false),
      emotionId: cleanText(input.emotionId || '', 'emotion_id', 80, false),
      feelingId: cleanText(input.feelingId || '', 'feeling_id', 80, false),
      contextWordId: cleanText(input.contextWordId || '', 'context_word_id', 80, false),
      contextWord: cleanText(input.contextWord || '', 'context_word', 80, false),
      bodyStateId: cleanText(input.bodyStateId || '', 'body_state_id', 80, false),
      bodyState: cleanText(input.bodyState || '', 'body_state', 80, false),
      note: cleanText(input.note || '', 'note', 600, false),
      timezone: cleanText(input.timezone || '', 'timezone', 80, false),
      schemaVersion: cleanText(input.schemaVersion || '', 'schema_version', 80, false),
      status: 'completed'
    };
    if (typeof input.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error('invalid_date');
    entry.date = input.date;
    return await saveDailyCheckInForMember(member._id, entry);
  } catch (error) {
    return { bridgeError: error?.message || 'daily_check_in_failed' };
  }
});
