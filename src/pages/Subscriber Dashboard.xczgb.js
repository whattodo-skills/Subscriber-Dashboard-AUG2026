import wixData from 'wix-data';
import wixUsers from 'wix-users';
import { dailyCheckIn } from 'backend/daily-check-in.web';

let dashboardReady = false;
let cachedPayload = null;
const BRIDGE_ACTIONS = new Set(['list', 'previewRecommendations', 'startLoop', 'markSkillOpened', 'completeLoop', 'dismissLoop', 'getReflection', 'saveStack', 'removeStack']);
const bridgeRequests = new Set();

function installDailyCheckInBridge() {
  const component = $w('#html6');
  let bridgeReady = false;
  component.onMessage(async ({ data }) => {
    if (!data || data.type !== 'dashboardBridgeReady') return;
    bridgeReady = true;
    component.postMessage({ type: 'bridgeReady' });
  });
  component.onMessage(async ({ data }) => {
    if (!bridgeReady || !data || data.type !== 'dailyCheckInBridgeRequest') return;
    if (!BRIDGE_ACTIONS.has(data.action) || typeof data.requestId !== 'string' || !data.requestId || bridgeRequests.has(data.requestId)) return;
    bridgeRequests.add(data.requestId);
    try {
      const result = await dailyCheckIn({ action: data.action, entry: data.entry || {} });
      component.postMessage({ type: 'dailyCheckInBridgeResponse', requestId: data.requestId, action: data.action, ok: true, data: result });
    } catch (error) {
      component.postMessage({ type: 'dailyCheckInBridgeResponse', requestId: data.requestId, action: data.action, ok: false, error: error?.message || 'bridge_request_failed' });
    }
  });
}

$w.onReady(function () {
  installDailyCheckInBridge();
  $w('#html6').onMessage(async (event) => {
    const msg = event.data || {};

    if (msg.type === 'dashboardReady') {
      dashboardReady = true;
      cachedPayload = await buildDashboardPayload();
      sendDashboardPayload();
    }
  });
});

async function buildDashboardPayload() {
  const skills = await loadPublishedSkills();
  const goalCard = await loadGoalCard();

  return {
    type: 'dashboardInit',
    skills,
    goalCard,
    notifications: [
      { title: 'Keep practicing', meta: 'Check your goals and mark today’s skill practice.', unread: true },
      { title: 'New skills available', meta: 'Open the Skills Hub to see what is new.', unread: false }
    ],
    groups: [
      { name: 'Skill Builders Community', meta: 'Check in with other subscribers.' }
    ],
    programs: [
      { name: 'My Programs', meta: 'Continue your current program.' }
    ],
    blogs: [
      { name: 'Recent Articles', meta: 'Read the latest What To Do! posts.' }
    ]
  };
}

async function loadPublishedSkills() {
  try {
    const result = await wixData.query('Skills')
      .eq('isPublished', true)
      .limit(100)
      .find();

    return result.items.map((item) => ({
      id: item._id,
      name: item.name,
      category: item.category,
      description: item.description,
      desiredOutcome: item.desiredOutcome,
      htmlUrl: item.htmlUrl,
      isPublished: item.isPublished
    }));
  } catch (error) {
    console.log('Could not load skills for dashboard', error);
    return [];
  }
}

async function loadGoalCard() {
  if (!wixUsers.currentUser.loggedIn) {
    return { goals: [] };
  }

  try {
    const memberId = wixUsers.currentUser.id;
    const result = await wixData.query('SubscriberGoalCards')
      .eq('memberId', memberId)
      .descending('updatedAt')
      .limit(1)
      .find();

    if (!result.items.length) {
      return { goals: [] };
    }

    const item = result.items[0];

    return {
      goals: safeParse(item.goalsJson, []),
      checks: safeParse(item.checksJson, {}),
      ratings: safeParse(item.ratingsJson, {}),
      obstacles: item.obstacles || '',
      helped: item.helped || '',
      updatedAt: item.updatedAt || null
    };
  } catch (error) {
    console.log('Could not load goal card for dashboard', error);
    return { goals: [] };
  }
}

function sendDashboardPayload() {
  if (!dashboardReady || !cachedPayload) {
    return;
  }

  $w('#html6').postMessage(cachedPayload);
}

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}
