// ─────────────────────────────────────────────────────────────────────────────
// FILE: Velo_GoalTracker.js
// PASTE THIS into: Wix Studio → Dev Mode → the Goal Tracker page code
//
// REQUIRED CMS COLLECTIONS (create these in Wix Content Manager first):
//
//  1. WTD-TrackerProfile
//     Field name        Type     Notes
//     ──────────────    ──────   ────────────────────────────────────
//     memberId          Text     The Wix member ID (index this field)
//     goals             Text     JSON string — array of {cat, goal}
//     startDate         Text     YYYY-MM-DD
//
//  2. WTD-TrackerWeek
//     Field name        Type     Notes
//     ──────────────    ──────   ────────────────────────────────────
//     memberId          Text     The Wix member ID (index this field)
//     weekKey           Text     e.g. "2025-W21" (index this field)
//     selfcare          Text     JSON string
//     emotions          Text     JSON string
//     urges             Text     JSON string
//     skills            Text     JSON string — array of skill numbers
//     notes             Text     JSON string — array of 7 day strings
//     progressPct       Number   Computed overall % (for dashboard queries)
//
//  PERMISSIONS: Both collections should be set to
//    Read:  Member (logged-in user reads only their own data)
//    Write: Member (logged-in user writes only their own data)
//    Use "Member authored content" permissions preset if available.
//
//  The iFrame element on this page is named: #html6
// ─────────────────────────────────────────────────────────────────────────────

import { authentication, currentMember } from 'wix-members';
import wixData from 'wix-data';

$w.onReady(async function () {

  // ── 1. Require login ───────────────────────────────────────────────────────
  if (!authentication.loggedIn()) {
    authentication.promptLogin({ mode: 'login' });
    return;
  }

  // ── 2. Load member + saved data in parallel ────────────────────────────────
  let member, profileItem, weekItems;

  try {
    member = await currentMember.getMember();

    [profileItem, weekItems] = await Promise.all([
      wixData.query('WTD-TrackerProfile')
        .eq('memberId', member._id)
        .limit(1)
        .find()
        .then(r => r.items[0] || null),

      wixData.query('WTD-TrackerWeek')
        .eq('memberId', member._id)
        .descending('weekKey')
        .limit(52)          // up to 1 year of weeks
        .find()
        .then(r => r.items)
    ]);

  } catch (err) {
    console.error('GoalTracker load error:', err);
    member      = null;
    profileItem = null;
    weekItems   = [];
  }

  // ── 3. Parse stored JSON safely ────────────────────────────────────────────
  function safeParse(str, fallback) {
    try { return str ? JSON.parse(str) : fallback; }
    catch(e) { return fallback; }
  }

  const profile = profileItem ? {
    goals:     safeParse(profileItem.goals, []),
    startDate: profileItem.startDate || ''
  } : { goals: [], startDate: '' };

  const weeks = (weekItems || []).map(w => ({
    weekKey:   w.weekKey,
    _id:       w._id,
    selfcare:  safeParse(w.selfcare,  {}),
    emotions:  safeParse(w.emotions,  {}),
    urges:     safeParse(w.urges,     {}),
    skills:    safeParse(w.skills,    []),
    notes:     safeParse(w.notes,     [])
  }));

  // ── 4. Send init data to iFrame ────────────────────────────────────────────
  $w('#html6').onMessage(async (event) => {
    const msg = event.data;
    if (!msg || !msg.type) return;

    switch (msg.type) {

      // iFrame is ready — send all data
      case 'trackerReady':
        $w('#html6').postMessage({
          type:       'trackerInit',
          memberId:   member ? member._id : null,
          memberName: member ? (member.contactDetails?.firstName || '') : '',
          profile,
          weeks
        });
        break;

      // ── Save goals + start date ──────────────────────────────────────────
      case 'saveTrackerProfile': {
        try {
          const goalsJson     = JSON.stringify(msg.goals     || []);
          const startDate     = msg.startDate || '';

          if (profileItem) {
            await wixData.update('WTD-TrackerProfile', {
              ...profileItem,
              goals:     goalsJson,
              startDate
            });
          } else {
            const newItem = await wixData.insert('WTD-TrackerProfile', {
              memberId: member._id,
              goals:    goalsJson,
              startDate
            });
            profileItem = newItem; // cache for future updates
          }
          $w('#html6').postMessage({ type: 'profileSaved', success: true });

        } catch (err) {
          console.error('saveTrackerProfile error:', err);
          $w('#html6').postMessage({ type: 'profileSaved', success: false });
        }
        break;
      }

      // ── Save one week of diary + skills data ─────────────────────────────
      case 'saveTrackerWeek': {
        try {
          const { weekKey, data } = msg;

          const payload = {
            memberId:    member._id,
            weekKey,
            selfcare:    JSON.stringify(data.selfcare  || {}),
            emotions:    JSON.stringify(data.emotions  || {}),
            urges:       JSON.stringify(data.urges     || {}),
            skills:      JSON.stringify(data.skills    || []),
            notes:       JSON.stringify(data.notes     || []),
            progressPct: msg.progressPct || 0
          };

          // Check if this week already exists
          const existingWeek = weekItems.find(w => w.weekKey === weekKey);

          if (existingWeek) {
            await wixData.update('WTD-TrackerWeek', { ...existingWeek, ...payload });
          } else {
            const newWeek = await wixData.insert('WTD-TrackerWeek', payload);
            weekItems.push(newWeek); // cache
          }

          $w('#html6').postMessage({ type: 'weekSaved', success: true, weekKey });

        } catch (err) {
          console.error('saveTrackerWeek error:', err);
          $w('#html6').postMessage({ type: 'weekSaved', success: false });
        }
        break;
      }

      // ── Progress update → forward to dashboard if needed ─────────────────
      case 'trackerProgress': {
        // Optional: store or broadcast the progress percentage
        // You can use this to update a progress display elsewhere on the page
        // e.g. $w('#progressBar').value = msg.progress;
        // console.log('Progress update:', msg.progress + '%');
        break;
      }
    }
  });
});