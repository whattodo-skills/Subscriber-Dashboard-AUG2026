import wixData from 'wix-data';
import wixUsers from 'wix-users';
import { dailyCheckIn } from 'backend/daily-check-in.web';

const BRIDGE_ACTIONS = new Set(['list', 'previewRecommendations', 'startLoop', 'markSkillOpened', 'completeLoop', 'dismissLoop', 'getReflection', 'saveStack', 'removeStack']);
const handledRequests = new Set();

$w.onReady(function () {
  const dashboard = $w('#html6');

  dashboard.onMessage(async ({ data }) => {
    if (!data || typeof data !== 'object') return;

    if (data.type === 'dashboardReady') {
      dashboard.postMessage(await buildDashboardPayload());
      return;
    }

    if (data.type === 'dashboardBridgeReady') {
      dashboard.postMessage({ type: 'bridgeReady' });
      return;
    }

    if (data.type !== 'dailyCheckInBridgeRequest') return;
    if (!BRIDGE_ACTIONS.has(data.action) || typeof data.requestId !== 'string' || !data.requestId || handledRequests.has(data.requestId)) return;
    handledRequests.add(data.requestId);
    try {
      const result = await dailyCheckIn({ action: data.action, entry: data.entry || {} });
      dashboard.postMessage({ type: 'dailyCheckInBridgeResponse', requestId: data.requestId, action: data.action, ok: true, data: result });
    } catch (error) {
      dashboard.postMessage({ type: 'dailyCheckInBridgeResponse', requestId: data.requestId, action: data.action, ok: false, error: error?.message || 'bridge_request_failed' });
    }
  });
});

async function buildDashboardPayload() {
  const [progress, stacks] = await Promise.all([
    dailyCheckIn({ action: 'list', entry: {} }).catch(() => ({})),
    loadSavedStack()
  ]);
  return {
    type: 'subscriberDashboardData',
    loggedIn: wixUsers.currentUser.loggedIn,
    checkins: progress.checkins || [],
    values: progress.values || {},
    pendingLoop: progress.pendingLoop || null,
    stacks: stacks.length ? stacks : (progress.stacks || [])
  };
}

async function loadSavedStack() {
  if (!wixUsers.currentUser.loggedIn) return [];
  try {
    const result = await wixData.query('WTD-FavoriteSkills')
      .eq('memberId', wixUsers.currentUser.id)
      .eq('stacked', true)
      .limit(100)
      .find();
    const latest = new Map();
    result.items.forEach((item) => {
      const catKey = normalizeCategory(item.catKey || item.catLabel);
      if (!catKey) return;
      const row = {
        _id: item._id,
        memberId: item.memberId,
        skillId: item.skillId || '',
        skillName: item.skillName || '',
        skillSlug: item.skillSlug || '',
        catKey,
        catLabel: { focus: 'Focus', coping: 'Coping', feelings: 'Feelings', connecting: 'Connecting' }[catKey],
        practiceUrl: item.practiceUrl || '',
        stackedAt: item.stackedAt || item._createdDate || null,
        lastActionAt: item.lastActionAt || item._updatedDate || null
      };
      const current = latest.get(catKey);
      if (!current || new Date(row.lastActionAt || row.stackedAt || 0) >= new Date(current.lastActionAt || current.stackedAt || 0)) latest.set(catKey, row);
    });
    return [...latest.values()];
  } catch (error) {
    console.log('Could not load Skills Stack for Dashboard Copy', error);
    return [];
  }
}

function normalizeCategory(value) {
  const key = String(value || '').trim().toLowerCase();
  if (key === 'focus') return 'focus';
  if (key === 'coping' || key === 'cope') return 'coping';
  if (key === 'feelings' || key === 'feeling') return 'feelings';
  if (key === 'connecting' || key === 'connection' || key === 'connect') return 'connecting';
  return '';
}
