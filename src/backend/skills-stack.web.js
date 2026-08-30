import { Permissions, webMethod } from 'wix-web-module';
import { currentMember } from 'wix-members-backend';
import { saveStackForMember, removeStackForMember } from './http-functions';

async function memberId() {
  const member = await currentMember.getMember();
  if (!member?._id) throw new Error('authenticated_member_required');
  return member._id;
}

function validateSkill(skill) {
  if (!skill || typeof skill !== 'object' || Array.isArray(skill)) throw new Error('invalid_stack_skill');
  const allowed = ['skillId', 'skillName', 'skillTitle', 'category', 'practiceUrl', 'publicUrl'];
  if (Object.keys(skill).some((key) => !allowed.includes(key))) throw new Error('unknown_stack_field');
  if (typeof skill.skillId !== 'string' || !skill.skillId || skill.skillId.length > 120) throw new Error('invalid_stack_skill');
  return { ...skill };
}

export const saveSkillsStack = webMethod(Permissions.SiteMember, async ({ skill } = {}) => {
  return saveStackForMember(await memberId(), validateSkill(skill));
});

export const removeSkillsStack = webMethod(Permissions.SiteMember, async ({ catKey } = {}) => {
  if (typeof catKey !== 'string' || !catKey.trim() || catKey.length > 80) throw new Error('invalid_category');
  return removeStackForMember(await memberId(), catKey.trim().toLowerCase());
});
