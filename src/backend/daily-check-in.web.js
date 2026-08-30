import { Permissions, webMethod } from 'wix-web-module';
import { currentMember } from 'wix-members-backend';
import { listForMember, previewForMember, startForMember, markSkillOpenedForMember, completeForMember, dismissForMember, getReflectionForMember } from './daily-check-in-service';
import { saveStackForMember, removeStackForMember } from './http-functions';

const ACTIONS = new Set(['list', 'previewRecommendations', 'startLoop', 'markSkillOpened', 'completeLoop', 'dismissLoop', 'getReflection', 'saveStack', 'removeStack']);
const MAX = { submissionId: 120, checkinId: 80, selectedSkillId: 80, selectedCategory: 40, selectedOutcome: 120, reflection: 600 };
const IDS = /^[A-Za-z0-9_-]{1,80}$/;
const STATUS = new Set(['recommended', 'learn_pending', 'complete']);

function text(value, max) {
  if (typeof value !== 'string' || value.length > max) throw new Error('invalid_field');
  return value.trim();
}
function id(value) { const result = text(value, MAX.checkinId); if (!IDS.test(result)) throw new Error('invalid_id'); return result; }
function validate(action, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_entry');
  const allowed = {
    list: [], previewRecommendations: ['selectedCategory', 'selectedOutcome'],
    startLoop: ['submissionId', 'date', 'noticeSelection', 'emotion', 'intensityBefore', 'understandInfluence', 'understandPriority', 'selectedCategory', 'selectedOutcome', 'recommendedSkillIds', 'selectedSkillId', 'practiceAction', 'completeWithoutSkill'],
    markSkillOpened: ['checkinId'], completeLoop: ['checkinId', 'learnResult', 'intensityAfter', 'carryForward', 'reflectionSaved', 'privateReflection'],
    dismissLoop: ['checkinId'], getReflection: ['checkinId'], saveStack: ['skill'], removeStack: ['catKey']
  }[action];
  const required = { list: [], previewRecommendations: ['selectedCategory', 'selectedOutcome'], startLoop: ['submissionId'], markSkillOpened: ['checkinId'], completeLoop: ['checkinId'], dismissLoop: ['checkinId'], getReflection: ['checkinId'], saveStack: ['skill'], removeStack: ['catKey'] }[action];
  required.forEach((key) => { if (input[key] === undefined || input[key] === null || input[key] === '') throw new Error(`missing_${key}`); });
  Object.keys(input).forEach((key) => { if (!allowed.includes(key)) throw new Error('unknown_field'); });
  if (input.checkinId !== undefined) input.checkinId = id(input.checkinId);
  if (input.submissionId !== undefined) input.submissionId = text(input.submissionId, MAX.submissionId);
  if (input.selectedSkillId !== undefined) input.selectedSkillId = id(input.selectedSkillId);
  if (input.selectedCategory !== undefined) input.selectedCategory = text(input.selectedCategory, MAX.selectedCategory);
  if (input.selectedOutcome !== undefined) input.selectedOutcome = text(input.selectedOutcome, MAX.selectedOutcome);
  if (input.recommendedSkillIds !== undefined && (!Array.isArray(input.recommendedSkillIds) || input.recommendedSkillIds.length > 3)) throw new Error('invalid_skill_ids');
  if (input.recommendedSkillIds) input.recommendedSkillIds = input.recommendedSkillIds.map(id);
  if (input.privateReflection !== undefined) input.privateReflection = text(input.privateReflection, MAX.reflection);
  ['intensityBefore', 'intensityAfter'].forEach((key) => { if (input[key] !== undefined && (!Number.isInteger(input[key]) || input[key] < 1 || input[key] > 10)) throw new Error('invalid_rating'); });
  ['reflectionSaved', 'completeWithoutSkill'].forEach((key) => { if (input[key] !== undefined && typeof input[key] !== 'boolean') throw new Error('invalid_boolean'); });
  if (input.date !== undefined && (typeof input.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.date))) throw new Error('invalid_date');
  if (action === 'saveStack') {
    if (!input.skill || typeof input.skill !== 'object' || Array.isArray(input.skill)) throw new Error('invalid_stack_skill');
    const allowedSkillFields = ['skillId', 'skillName', 'skillTitle', 'category', 'practiceUrl', 'publicUrl'];
    if (Object.keys(input.skill).some((key) => !allowedSkillFields.includes(key))) throw new Error('unknown_stack_field');
    if (typeof input.skill.skillId !== 'string' || input.skill.skillId.length > 120) throw new Error('invalid_stack_skill');
  }
  if (input.catKey !== undefined) input.catKey = text(input.catKey, 80).toLowerCase();
  if (input.practiceAction !== undefined && !['practice', 'save_for_later', 'no_skill'].includes(input.practiceAction)) throw new Error('invalid_practice_action');
  if (input.learnResult !== undefined && input.learnResult !== null) input.learnResult = text(input.learnResult, 160);
  if (input.carryForward !== undefined && input.carryForward !== null) input.carryForward = text(input.carryForward, 160);
  if (input.loopStatus !== undefined && !STATUS.has(input.loopStatus)) throw new Error('invalid_loop_status');
  return input;
}

export const dailyCheckIn = webMethod(Permissions.SiteMember, async ({ action, entry = {} } = {}) => {
  if (!ACTIONS.has(action)) throw new Error('unsupported_action');
  const member = await currentMember.getMember();
  if (!member?._id) throw new Error('authenticated_member_required');
  const safe = validate(action, { ...entry });
  // Service functions must query/update by both check-in ID and this member ID.
  // They must construct CMS records explicitly; never spread `safe` into a record.
  return dispatchAction(action, member._id, safe);
});

async function dispatchAction(action, memberId, entry) {
  if (action === 'list') return listForMember(memberId);
  if (action === 'previewRecommendations') return previewForMember(entry);
  if (action === 'startLoop') return startForMember(memberId, entry);
  if (action === 'markSkillOpened') return markSkillOpenedForMember(memberId, entry);
  if (action === 'completeLoop') return completeForMember(memberId, entry);
  if (action === 'dismissLoop') return dismissForMember(memberId, entry);
  if (action === 'saveStack') return saveStackForMember(memberId, entry.skill);
  if (action === 'removeStack') return removeStackForMember(memberId, entry.catKey);
  return getReflectionForMember(memberId, entry);
}
