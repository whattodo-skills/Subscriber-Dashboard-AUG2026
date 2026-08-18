import { getCheckins, getValues, getStacks, getPendingLoop, previewRecommendations, startLoop, updateStatus, completeLoop, getReflection } from './http-functions';

export async function listForMember(memberId) {
  return { checkins: await getCheckins(memberId), values: await getValues(memberId), stacks: await getStacks(memberId), pendingLoop: await getPendingLoop(memberId) };
}
export function previewForMember(entry) { return previewRecommendations(entry); }
export function startForMember(memberId, entry) { return startLoop(memberId, entry); }
export function markSkillOpenedForMember(memberId, entry) { return updateStatus(memberId, entry.checkinId, 'learn_pending'); }
export function completeForMember(memberId, entry) { return completeLoop(memberId, entry, false); }
export function dismissForMember(memberId, entry) { return completeLoop(memberId, entry, true); }
export function getReflectionForMember(memberId, entry) { return getReflection(memberId, entry.checkinId); }
