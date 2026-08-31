import { Permissions, webMethod } from 'wix-web-module';
import { currentMember } from 'wix-members-backend';
import { startLoop } from './http-functions';

const ID = /^[A-Za-z0-9_-]{1,120}$/;
function text(value, max = 300) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function skillIds(value) {
  if (!Array.isArray(value) || value.length > 3 || value.some(id => typeof id !== 'string' || !ID.test(id))) throw new Error('invalid_skill_ids');
  return [...value];
}

export const startDecisionLoop = webMethod(Permissions.SiteMember, async ({ entry = {} } = {}) => {
  try {
    const member = await currentMember.getMember();
    if (!member?._id) return { bridgeError: 'authenticated_member_required' };
    const submissionId = text(entry.submissionId, 120);
    const selectedSkillId = text(entry.selectedSkillId, 120);
    if (!submissionId || !ID.test(submissionId) || (selectedSkillId && !ID.test(selectedSkillId))) return { bridgeError: 'invalid_id' };
    const intensity = entry.intensityBefore == null ? null : Number(entry.intensityBefore);
    if (intensity !== null && (!Number.isInteger(intensity) || intensity < 1 || intensity > 10)) return { bridgeError: 'invalid_rating' };
    return await startLoop(member._id, {
      submissionId,
      date: text(entry.date, 10),
      noticeSelection: text(entry.noticeSelection),
      emotion: text(entry.emotion, 80),
      intensityBefore: intensity,
      understandInfluence: text(entry.understandInfluence),
      understandPriority: text(entry.understandPriority),
      selectedCategory: text(entry.selectedCategory, 40),
      selectedOutcome: text(entry.selectedOutcome, 120),
      recommendedSkillIds: skillIds(entry.recommendedSkillIds),
      selectedSkillId,
      practiceAction: text(entry.practiceAction, 40),
      completeWithoutSkill: entry.completeWithoutSkill === true
    });
  } catch (error) {
    return { bridgeError: error?.message || 'decision_loop_save_failed' };
  }
});
