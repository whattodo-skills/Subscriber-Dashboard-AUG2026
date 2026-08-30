import { Permissions, webMethod } from 'wix-web-module';
import { currentMember } from 'wix-members-backend';
import { saveDailyCheckInForMember } from './http-functions';

function cleanText(value, field) {
  if (typeof value !== 'string') throw new Error(`invalid_${field}`);
  const result = value.trim();
  if (!result || result.length > 80) throw new Error(`invalid_${field}`);
  return result;
}

export const saveDailyCheckIn = webMethod(Permissions.SiteMember, async ({ emotion, feeling, date } = {}) => {
  const member = await currentMember.getMember();
  if (!member?._id) throw new Error('authenticated_member_required');
  const entry = {
    emotion: cleanText(emotion, 'emotion'),
    feeling: cleanText(feeling, 'feeling')
  };
  if (date !== undefined) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('invalid_date');
    entry.date = date;
  }
  return saveDailyCheckInForMember(member._id, entry);
});
