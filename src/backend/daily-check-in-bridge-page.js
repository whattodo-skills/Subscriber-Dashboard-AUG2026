import { dailyCheckIn } from 'backend/daily-check-in.web';
import { saveDailyCheckIn } from 'backend/member-check-in.web';
import { saveSkillsStack, removeSkillsStack } from 'backend/skills-stack.web';

const ACTIONS = new Set(['list', 'previewRecommendations', 'saveCheckin', 'startLoop', 'markSkillOpened', 'completeLoop', 'dismissLoop', 'getReflection', 'saveStack', 'removeStack']);
const seen = new Set();
let dashboardReady = false;

export function installDailyCheckInBridge($w) {
  const component = $w('#html6');
  component.onMessage(async ({ data }) => {
    if (!data || data.type !== 'dashboardBridgeReady') { return; }
    dashboardReady = true;
    component.postMessage({ type: 'bridgeReady' });
  });
  component.onMessage(async ({ data }) => {
    if (!dashboardReady || !data || data.type !== 'dailyCheckInBridgeRequest') return;
    if (!ACTIONS.has(data.action) || typeof data.requestId !== 'string' || !data.requestId || seen.has(data.requestId)) return;
    seen.add(data.requestId);
    try {
      const result = await dispatchBridgeAction(data.action, data.entry || {});
      if (result?.__bridgeError) throw new Error(result.__bridgeError);
      component.postMessage({ type: 'dailyCheckInBridgeResponse', requestId: data.requestId, action: data.action, ok: true, data: result });
    } catch (error) {
      component.postMessage({ type: 'dailyCheckInBridgeResponse', requestId: data.requestId, action: data.action, ok: false, error: error?.message || 'bridge_request_failed' });
    }
  });
}

function dispatchBridgeAction(action, entry) {
  if (action === 'saveCheckin') return saveDailyCheckIn(entry);
  if (action === 'saveStack') return saveSkillsStack({ skill: entry.skill });
  if (action === 'removeStack') return removeSkillsStack({ catKey: entry.catKey });
  return dailyCheckIn({ action, entry });
}

export function onReady($w) {
  installDailyCheckInBridge($w);
}
