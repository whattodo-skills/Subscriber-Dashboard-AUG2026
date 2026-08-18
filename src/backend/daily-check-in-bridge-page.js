import { dailyCheckIn } from 'backend/daily-check-in.web';

const ACTIONS = new Set(['list', 'previewRecommendations', 'startLoop', 'markSkillOpened', 'completeLoop', 'dismissLoop', 'getReflection']);
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
      const result = await dailyCheckIn({ action: data.action, entry: data.entry || {} });
      component.postMessage({ type: 'dailyCheckInBridgeResponse', requestId: data.requestId, action: data.action, ok: true, data: result });
    } catch (error) {
      component.postMessage({ type: 'dailyCheckInBridgeResponse', requestId: data.requestId, action: data.action, ok: false, error: error?.message || 'bridge_request_failed' });
    }
  });
}

export function onReady($w) {
  installDailyCheckInBridge($w);
}
