import wixData from 'wix-data';
import wixUsers from 'wix-users';
import { orders } from 'wix-pricing-plans-frontend';
import { fetch } from 'wix-fetch';

let skills = [];
let currentUserTiers = ['Free'];
let hasLoaded = false;
const handledStackRequests = new Set();
let skillsHubComponents = [];

$w.onReady(function () {
  skillsHubComponents = $w('HtmlComponent');

  skillsHubComponents.forEach((skillsHub) => {
    skillsHub.onMessage(async (event) => {
    const data = event.data;

    if (data && data.type === 'skillsHubReady') {
      loadSkillsAndAccess();
      return;
    }

    if (!isStackRequest(data) || handledStackRequests.has(data.requestId)) {
      return;
    }

    handledStackRequests.add(data.requestId);

    try {
      const response = await fetch('https://www.whattodo.coach/_functions/dailyCheckIn', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'saveStack', entry: { skill: data.skill } })
      });
      const result = await response.json();

      if (!response.ok || !result.ok || !result.saved) {
        throw new Error(result.error || 'skills_stack_save_failed');
      }

      skillsHub.postMessage({
        type: 'stackSkillResult',
        requestId: data.requestId,
        ok: true,
        data: result
      });
    } catch (error) {
      console.error('Could not save skill to Skills Stack:', error);
      skillsHub.postMessage({
        type: 'stackSkillResult',
        requestId: data.requestId,
        ok: false,
        error: error && error.message ? error.message : 'skills_stack_save_failed'
      });
    }
    });
  });

  setTimeout(() => {
    if (!hasLoaded) {
      loadSkillsAndAccess();
    }
  }, 1500);
});

async function loadSkillsAndAccess() {
  if (hasLoaded) return;
  hasLoaded = true;

  try {
    const skillsResult = await wixData.query('Skills')
      .include('eligibleSubscriberTier')
      .ascending('displayOrder')
      .limit(1000)
      .find();

    skills = skillsResult.items
      .filter(skill => skill.isPublished !== false)
      .map(skill => {
        return {
          ...skill,
          eligibleSubscriberTier: normalizeTiers(skill.eligibleSubscriberTier)
        };
      });

  } catch (error) {
    console.log('Could not load Skills CMS:', error);
    skills = [];
  }

  if (wixUsers.currentUser.loggedIn) {
    try {
      const memberOrdersResult = await orders.listCurrentMemberOrders();

      const memberOrders = Array.isArray(memberOrdersResult)
        ? memberOrdersResult
        : memberOrdersResult.orders || [];

      const activePlanNames = memberOrders
        .filter(order => {
          const status = String(order.status || '').toUpperCase();
          return status === 'ACTIVE' || status.includes('ACTIVE');
        })
        .map(order => {
          return order.planName ||
            (order.plan && order.plan.name) ||
            (order.plan && order.plan.title) ||
            order.name ||
            '';
        })
        .filter(Boolean);

      currentUserTiers = normalizeCurrentUserTiers(['Free', ...activePlanNames]);

      console.log('Current user tiers:', currentUserTiers);
    } catch (error) {
      console.log('Could not load pricing plans. Showing Free access only:', error);
      currentUserTiers = ['Free'];
    }
  } else {
    currentUserTiers = ['Free'];
  }

  sendSkillsToHub();
}

function isStackRequest(data) {
  return Boolean(
    data &&
    data.type === 'stackSkill' &&
    data.source === 'wtd-skills-hub' &&
    data.action === 'stack' &&
    typeof data.requestId === 'string' &&
    data.requestId.length > 0 &&
    data.requestId.length <= 120 &&
    data.skill &&
    typeof data.skill === 'object' &&
    !Array.isArray(data.skill) &&
    typeof data.skill.skillId === 'string' &&
    data.skill.skillId.length > 0 &&
    data.skill.skillId.length <= 120
  );
}

function normalizeCurrentUserTiers(tiers) {
  let normalized = [];

  tiers.forEach(tier => {
    if (!tier) return;

    normalized.push(tier);

    // Wix may use the old/internal plan name for the Plus plan.
    if (tier === 'Premium Coaching Circle') {
      normalized.push('What To Do! Plus');
    }

    if (tier === 'What To Do! Plus') {
      normalized.push('Premium Coaching Circle');
    }
  });

  return [...new Set(normalized)];
}

function normalizeTiers(tiers) {
  if (!tiers) return ['Free'];

  if (Array.isArray(tiers)) {
    if (tiers.length === 0) return ['Free'];

    const names = tiers.map(tier => {
      if (typeof tier === 'string') return tier;

      return tier.name ||
        tier.title ||
        tier.title_fld ||
        tier.label ||
        (tier.data && (
          tier.data.name ||
          tier.data.title ||
          tier.data.title_fld ||
          tier.data.label
        )) ||
        tier._id;
    }).filter(Boolean);

    return names.length ? names : ['Free'];
  }

  if (typeof tiers === 'string') {
    return [tiers];
  }

  const name = tiers.name ||
    tiers.title ||
    tiers.title_fld ||
    tiers.label ||
    (tiers.data && (
      tiers.data.name ||
      tiers.data.title ||
      tiers.data.title_fld ||
      tiers.data.label
    )) ||
    tiers._id;

  return name ? [name] : ['Free'];
}

function sendSkillsToHub() {
  skillsHubComponents.forEach((skillsHub) => {
    skillsHub.postMessage({
      type: 'skillsHubInit',
      skills: skills,
      currentUserTiers: currentUserTiers
    });
  });
}
