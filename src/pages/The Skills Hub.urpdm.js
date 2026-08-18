import wixData from 'wix-data';
import wixUsers from 'wix-users';
import { orders } from 'wix-pricing-plans-frontend';

let skills = [];
let currentUserTiers = ['Free'];
let hasLoaded = false;

$w.onReady(function () {
  $w('#html6').onMessage((event) => {
    if (event.data && event.data.type === 'skillsHubReady') {
      loadSkillsAndAccess();
    }
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
  $w('#html6').postMessage({
    type: 'skillsHubInit',
    skills: skills,
    currentUserTiers: currentUserTiers
  });
}