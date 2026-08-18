import { ok, badRequest, serverError } from 'wix-http-functions';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

const CHECKINS = 'MoodCheckIns';
const SKILLS = 'Skills';
const VALUES = 'MemberValues';
const STACKS = 'WTD-FavoriteSkills';
const OPTIONS = { suppressAuth: true };
const CORS = {
  'Access-Control-Allow-Origin': 'https://whattodo-skills.github.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true'
};
const STATUSES = ['recommended', 'learn_pending', 'complete'];
const ROUTES = {
  'Be present': ['662740aa-3cb3-4470-a5a5-fadad9baea5e', 'c991b7f7-90f2-4e68-9921-63027bd999ab', 'fe4493ea-a69b-4821-b39d-da7d88aee57c'],
  'Start something': ['ab3a87ad-140c-449a-b79a-7f1c421e5a12', '32f9b822-9a9e-4274-a02e-1bbb8146c210', 'fe4493ea-a69b-4821-b39d-da7d88aee57c'],
  'Stay with something': ['d59a24fa-ee8a-445c-b570-804d54d573a8', 'fe4493ea-a69b-4821-b39d-da7d88aee57c', '662740aa-3cb3-4470-a5a5-fadad9baea5e'],
  'Organize my attention': ['fe4493ea-a69b-4821-b39d-da7d88aee57c', 'c991b7f7-90f2-4e68-9921-63027bd999ab', '32f9b822-9a9e-4274-a02e-1bbb8146c210'],
  'Make a decision': ['32f9b822-9a9e-4274-a02e-1bbb8146c210', '6ca17d5b-b054-47fc-8b52-3d1f8988c6ce', 'bb6c165e-c3c8-4fe9-b404-d1b2e93202a1'],
  'Follow through': ['d59a24fa-ee8a-445c-b570-804d54d573a8', 'ab3a87ad-140c-449a-b79a-7f1c421e5a12', 'fe4493ea-a69b-4821-b39d-da7d88aee57c'],
  'Get steadier': ['639ad66e-4f21-43a0-a9a2-00e754656cb5', '631d5ba5-19d4-43ed-a938-863e33b7010c', '5068e864-e4df-473e-a159-ae385872ce26'],
  'Tolerate something I cannot change': ['e3b58240-ca1d-4d74-b74e-46bd16ed80fc', '5068e864-e4df-473e-a159-ae385872ce26', '12e7a522-325e-4ff6-a97a-49ddcfc69d47'],
  'Adapt to change': ['f22935bb-27bb-429f-8ac0-ad58509def06', 'e3b58240-ca1d-4d74-b74e-46bd16ed80fc', 'eaf1b079-2c29-46be-9dfe-3dcaab6c3287'],
  'Prepare for something difficult': ['25056cda-c78e-4b84-a831-ed9d159b5307', '5dd00528-dd37-4b9a-92cb-a0a55ce53e66', '631d5ba5-19d4-43ed-a938-863e33b7010c'],
  'Recover from a setback': ['f3bfdcf6-187b-434e-b8b3-9eb79afbada4', 'e3b58240-ca1d-4d74-b74e-46bd16ed80fc', 'eaf1b079-2c29-46be-9dfe-3dcaab6c3287'],
  'Solve what I can': ['eaf1b079-2c29-46be-9dfe-3dcaab6c3287', 'e3b58240-ca1d-4d74-b74e-46bd16ed80fc', '5dd00528-dd37-4b9a-92cb-a0a55ce53e66'],
  'Ask for support': ['5dd00528-dd37-4b9a-92cb-a0a55ce53e66', '25056cda-c78e-4b84-a831-ed9d159b5307', 'eaf1b079-2c29-46be-9dfe-3dcaab6c3287'],
  "Name what I'm feeling": ['006e5d99-01f0-48b0-93f7-ae2761673c22', 'aeecb53f-9f00-4663-a6ec-642f64848c9c', '9d9261a5-946a-44a0-b22b-b8cd7e9e70d5'],
  'Understand what triggered it': ['a6ca2a6f-9918-4030-b1d3-58cf39da82d7', '272be988-5d3b-449b-802f-955266adaed6', '869f1c78-1d5d-4a93-a0b9-1b9f0a5b23fc'],
  'Check my interpretation': ['272be988-5d3b-449b-802f-955266adaed6', '9d9261a5-946a-44a0-b22b-b8cd7e9e70d5', 'c5581183-bc0a-48a8-97f2-09445677948f'],
  'Reduce emotional reactivity': ['433d8c47-b1ab-4f48-accc-026fa3832528', '632de9ce-9036-4c12-8570-76644001a2d0', 'c5581183-bc0a-48a8-97f2-09445677948f'],
  'Respond differently': ['632de9ce-9036-4c12-8570-76644001a2d0', '433d8c47-b1ab-4f48-accc-026fa3832528', 'fe4ab622-2342-45dd-83eb-c2c04cc2414b'],
  'Express the feeling constructively': ['632de9ce-9036-4c12-8570-76644001a2d0', '006e5d99-01f0-48b0-93f7-ae2761673c22', '869f1c78-1d5d-4a93-a0b9-1b9f0a5b23fc'],
  'Listen and understand': ['c9fc833f-d210-46ca-9a28-a770b4c0fe63', 'b20b79d1-0bb2-48b3-97c1-c148d509cfc8', 'e15b2121-bdff-40ad-9d67-5bd685287d05'],
  'Ask for what I need': ['e6f5c095-7973-4939-972a-1054699fdf39', '5e1c3af6-c720-4310-96ac-f22c15dac92f', '8fe79ad9-34f6-4b38-92bd-22431c0e44af'],
  'Set a boundary': ['8fe79ad9-34f6-4b38-92bd-22431c0e44af', 'f9fb0245-e6d8-4d90-9215-117b214acb21', '5e1c3af6-c720-4310-96ac-f22c15dac92f'],
  'Navigate conflict': ['7ba29d80-5db5-4f4b-9f0e-40d717ce6ca3', 'c9fc833f-d210-46ca-9a28-a770b4c0fe63', '5e1c3af6-c720-4310-96ac-f22c15dac92f'],
  'Repair after conflict': ['0b0f1d31-c147-47e5-b9b9-c86fef92c3e6', 'c02412fb-3452-4510-a2ee-354d5fa1cd59', 'e15b2121-bdff-40ad-9d67-5bd685287d05'],
  'Strengthen a relationship': ['c02412fb-3452-4510-a2ee-354d5fa1cd59', '32e21088-6c74-442f-95ed-ff3ba2ea4863', 'e15b2121-bdff-40ad-9d67-5bd685287d05'],
  'Offer support': ['e15b2121-bdff-40ad-9d67-5bd685287d05', 'c9fc833f-d210-46ca-9a28-a770b4c0fe63', '32e21088-6c74-442f-95ed-ff3ba2ea4863'],
  'Receive support': ['e6f5c095-7973-4939-972a-1054699fdf39', '5e1c3af6-c720-4310-96ac-f22c15dac92f', '8fe79ad9-34f6-4b38-92bd-22431c0e44af']
};
const APPROVED_RATIONALES = {
  'Be present': {
    '662740aa-3cb3-4470-a5a5-fadad9baea5e': 'notice attention drift and return to one manageable present activity',
    'c991b7f7-90f2-4e68-9921-63027bd999ab': 'use a concrete anchor and deliberately return your attention',
    'fe4493ea-a69b-4821-b39d-da7d88aee57c': 'notice distraction and return to one visible action'
  },
  'Start something': {
    'ab3a87ad-140c-449a-b79a-7f1c421e5a12': 'turn avoidance or uncertainty into a cue and tiny first action',
    '32f9b822-9a9e-4274-a02e-1bbb8146c210': 'clarify why beginning matters to you',
    'fe4493ea-a69b-4821-b39d-da7d88aee57c': 'reduce the start to one visible physical action'
  },
  'Stay with something': {
    'd59a24fa-ee8a-445c-b570-804d54d573a8': 'return when motivation, progress, or consistency slips',
    'fe4493ea-a69b-4821-b39d-da7d88aee57c': 'train your return after distraction',
    '662740aa-3cb3-4470-a5a5-fadad9baea5e': 'treat each return as the practice rather than as failure'
  },
  'Organize my attention': {
    'fe4493ea-a69b-4821-b39d-da7d88aee57c': 'narrow competing pulls to one visible action',
    'c991b7f7-90f2-4e68-9921-63027bd999ab': 'choose and return to one attention anchor',
    '32f9b822-9a9e-4274-a02e-1bbb8146c210': 'prioritize your attention according to what matters'
  },
  'Make a decision': {
    '32f9b822-9a9e-4274-a02e-1bbb8146c210': 'use your values to decide where attention and effort belong',
    '6ca17d5b-b054-47fc-8b52-3d1f8988c6ce': 'separate facts and inner signals from judgment',
    'bb6c165e-c3c8-4fe9-b404-d1b2e93202a1': 'create enough space to choose rather than react'
  },
  'Follow through': {
    'd59a24fa-ee8a-445c-b570-804d54d573a8': 'build a realistic return plan across different effort levels',
    'ab3a87ad-140c-449a-b79a-7f1c421e5a12': 'define a cue and one concrete next step',
    'fe4493ea-a69b-4821-b39d-da7d88aee57c': 'return deliberately when attention leaves the task'
  },
  'Get steadier': {
    '639ad66e-4f21-43a0-a9a2-00e754656cb5': 'choose and test a safe tool when activation is high',
    '631d5ba5-19d4-43ed-a938-863e33b7010c': 'interrupt an automatic reaction',
    '5068e864-e4df-473e-a159-ae385872ce26': 'stay present without making the moment harder'
  },
  'Tolerate something I cannot change': {
    'e3b58240-ca1d-4d74-b74e-46bd16ed80fc': 'acknowledge facts without treating acceptance as approval',
    '5068e864-e4df-473e-a159-ae385872ce26': 'endure the present without worsening it',
    '12e7a522-325e-4ff6-a97a-49ddcfc69d47': 'observe an urge without obeying it'
  },
  'Adapt to change': {
    'f22935bb-27bb-429f-8ac0-ad58509def06': 'separate what changed from the meaning added to it and choose a workable step',
    'e3b58240-ca1d-4d74-b74e-46bd16ed80fc': 'anchor yourself in the facts of the present',
    'eaf1b079-2c29-46be-9dfe-3dcaab6c3287': 'direct effort toward the part of the change you can influence'
  },
  'Prepare for something difficult': {
    '25056cda-c78e-4b84-a831-ed9d159b5307': 'rehearse a first move, backup, and realistic complication',
    '5dd00528-dd37-4b9a-92cb-a0a55ce53e66': 'plan appropriate help before the difficult moment',
    '631d5ba5-19d4-43ed-a938-863e33b7010c': 'prepare an immediate pause if emotion takes over'
  },
  'Recover from a setback': {
    'f3bfdcf6-187b-434e-b8b3-9eb79afbada4': 'learn, restart, and avoid turning against yourself',
    'e3b58240-ca1d-4d74-b74e-46bd16ed80fc': 'separate what happened from resistance and exaggeration',
    'eaf1b079-2c29-46be-9dfe-3dcaab6c3287': 'identify one practical restart action'
  },
  'Solve what I can': {
    'eaf1b079-2c29-46be-9dfe-3dcaab6c3287': 'define the problem, sort control, compare options, and start one action',
    'e3b58240-ca1d-4d74-b74e-46bd16ed80fc': 'separate controllable facts from what may need acceptance',
    '5dd00528-dd37-4b9a-92cb-a0a55ce53e66': 'identify where another person or resource can help'
  },
  'Ask for support': {
    '5dd00528-dd37-4b9a-92cb-a0a55ce53e66': 'identify the support type, appropriate source, and clear request',
    '25056cda-c78e-4b84-a831-ed9d159b5307': 'rehearse the request and prepare for possible responses',
    'eaf1b079-2c29-46be-9dfe-3dcaab6c3287': 'clarify which part of the problem needs outside help'
  },
  "Name what I'm feeling": {
    '006e5d99-01f0-48b0-93f7-ae2761673c22': 'name the emotion precisely and notice its intensity and body clues',
    'aeecb53f-9f00-4663-a6ec-642f64848c9c': 'broaden your emotion vocabulary and specificity',
    '9d9261a5-946a-44a0-b22b-b8cd7e9e70d5': 'distinguish the feeling from the thought associated with it'
  },
  'Understand what triggered it': {
    'a6ca2a6f-9918-4030-b1d3-58cf39da82d7': 'trace the event, interpretation, vulnerability factors, and emotional chain',
    '272be988-5d3b-449b-802f-955266adaed6': 'examine whether added meaning intensified the response',
    '869f1c78-1d5d-4a93-a0b9-1b9f0a5b23fc': 'separate the trigger from outside stress and emotional spillover'
  },
  'Check my interpretation': {
    '272be988-5d3b-449b-802f-955266adaed6': 'separate observable facts from the story and test alternatives',
    '9d9261a5-946a-44a0-b22b-b8cd7e9e70d5': 'see how an interpretation affects emotion',
    'c5581183-bc0a-48a8-97f2-09445677948f': 'create distance from a thought before treating it as fact'
  },
  'Reduce emotional reactivity': {
    '433d8c47-b1ab-4f48-accc-026fa3832528': 'check facts, safety, and urge effectiveness before rehearsing a different action',
    '632de9ce-9036-4c12-8570-76644001a2d0': 'pause the urge and compare realistic responses',
    'c5581183-bc0a-48a8-97f2-09445677948f': 'reduce the power of thoughts that amplify reactivity'
  },
  'Respond differently': {
    '632de9ce-9036-4c12-8570-76644001a2d0': 'identify what matters and select one response that supports it',
    '433d8c47-b1ab-4f48-accc-026fa3832528': 'build a whole-body alternative to an ineffective urge',
    'fe4ab622-2342-45dd-83eb-c2c04cc2414b': 'compare risks, priorities, and proportionate next steps'
  },
  'Express the feeling constructively': {
    '632de9ce-9036-4c12-8570-76644001a2d0': 'choose a response that supports goals, relationships, values, and self-respect',
    '006e5d99-01f0-48b0-93f7-ae2761673c22': 'clarify the emotion you are trying to express',
    '869f1c78-1d5d-4a93-a0b9-1b9f0a5b23fc': 'identify whether the next step is expression, problem-solving, coping, or connection'
  },
  'Listen and understand': {
    'c9fc833f-d210-46ca-9a28-a770b4c0fe63': 'clarify, reflect, and check understanding before responding',
    'b20b79d1-0bb2-48b3-97c1-c148d509cfc8': 'keep attention on the speaker rather than planning a reply',
    'e15b2121-bdff-40ad-9d67-5bd685287d05': 'add curiosity and perspective-taking without requiring agreement'
  },
  'Ask for what I need': {
    'e6f5c095-7973-4939-972a-1054699fdf39': 'build, check, and rehearse one clear request',
    '5e1c3af6-c720-4310-96ac-f22c15dac92f': 'strengthen the observable facts, reaction, and request',
    '8fe79ad9-34f6-4b38-92bd-22431c0e44af': 'set a clear limit when the need includes a boundary'
  },
  'Set a boundary': {
    '8fe79ad9-34f6-4b38-92bd-22431c0e44af': 'build and rehearse a clear limit and realistic follow-through',
    'f9fb0245-e6d8-4d90-9215-117b214acb21': 'state a boundary whose clearest form is refusal',
    '5e1c3af6-c720-4310-96ac-f22c15dac92f': 'state the limit without blame or ambiguity'
  },
  'Navigate conflict': {
    '7ba29d80-5db5-4f4b-9f0e-40d717ce6ca3': 'slow the disagreement, check interpretation, and rehearse a clear response',
    'c9fc833f-d210-46ca-9a28-a770b4c0fe63': 'reduce conflict driven by misunderstanding',
    '5e1c3af6-c720-4310-96ac-f22c15dac92f': 'prepare a direct and specific response'
  },
  'Repair after conflict': {
    '0b0f1d31-c147-47e5-b9b9-c86fef92c3e6': 'return after a hard moment with a concise repair',
    'c02412fb-3452-4510-a2ee-354d5fa1cd59': 'create a repeatable commitment or repair plan',
    'e15b2121-bdff-40ad-9d67-5bd685287d05': "acknowledge the other person's perspective while retaining boundaries"
  },
  'Strengthen a relationship': {
    'c02412fb-3452-4510-a2ee-354d5fa1cd59': 'turn relationship strengthening into one repeatable trust behavior',
    '32e21088-6c74-442f-95ed-ff3ba2ea4863': 'reinforce a specific behavior you value',
    'e15b2121-bdff-40ad-9d67-5bd685287d05': 'strengthen connection through curiosity and perspective-taking'
  },
  'Offer support': {
    'e15b2121-bdff-40ad-9d67-5bd685287d05': 'prepare a supportive response grounded in curiosity rather than assumption',
    'c9fc833f-d210-46ca-9a28-a770b4c0fe63': 'identify what kind of support the other person actually wants',
    '32e21088-6c74-442f-95ed-ff3ba2ea4863': 'offer specific, genuine encouragement when appreciation fits'
  },
  'Receive support': {
    'e6f5c095-7973-4939-972a-1054699fdf39': 'identify what would help and make one clear request',
    '5e1c3af6-c720-4310-96ac-f22c15dac92f': 'communicate the situation and requested support without ambiguity',
    '8fe79ad9-34f6-4b38-92bd-22431c0e44af': 'define what kind of help is and is not workable'
  }
};

export function options_dailyCheckIn() {
  return ok({ headers: CORS, body: { ok: true } });
}

export async function post_dailyCheckIn(request) {
  try {
    const body = await request.body.json();
    const action = String(body?.action || 'list');
    const subscriber = await getSubscriber(body);
    if (!subscriber.id) return response(badRequest, { ok: false, error: 'missing_subscriber' });
    const entry = body?.entry || {};
    let result = {};
    if (action === 'save') result = await saveLegacy(subscriber.id, entry);
    else if (action === 'previewRecommendations') result = await previewRecommendations(entry);
    else if (action === 'startLoop') result = await startLoop(subscriber.id, entry);
    else if (action === 'markSkillOpened') result = await updateStatus(subscriber.id, entry.checkinId, 'learn_pending');
    else if (action === 'completeLoop') result = await completeLoop(subscriber.id, entry, false);
    else if (action === 'dismissLoop') result = await completeLoop(subscriber.id, entry, true);
    else if (action === 'getReflection') return response(ok, await getReflection(subscriber.id, entry.checkinId));
    else if (action !== 'list') return response(badRequest, { ok: false, error: 'unsupported_action' });
    return response(ok, {
      ok: true,
      loggedIn: !subscriber.id.startsWith('client:'),
      firstName: subscriber.firstName,
      checkins: await getCheckins(subscriber.id),
      values: subscriber.id.startsWith('client:') ? [] : await getValues(subscriber.id),
      stacks: subscriber.id.startsWith('client:') ? [] : await getStacks(subscriber.id),
      pendingLoop: await getPendingLoop(subscriber.id),
      ...result
    });
  } catch (error) {
    console.error('Daily Check-In endpoint failed', error);
    return response(serverError, { ok: false, error: 'daily_checkin_failed' });
  }
}

function response(factory, body) { return factory({ headers: CORS, body }); }
function dateKey(value = new Date()) { const d = new Date(value); return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10); }
function dateValue(key) { return new Date(`${key}T12:00:00.000Z`); }
function clean(value, max = 300) { return String(value || '').trim().slice(0, max); }
function number1to10(value) { const n = Number(value); return Number.isInteger(n) && n >= 1 && n <= 10 ? n : undefined; }

async function getSubscriber(body) {
  try {
    const member = await currentMember.getMember();
    if (member?._id) return { id: member._id, firstName: clean(member.contactDetails?.firstName || member.profile?.nickname || '', 80).split(' ')[0] };
  } catch (error) { console.log('No authenticated member', error); }
  return { id: '', firstName: '' };
}

async function memberItems(memberId) {
  return (await wixData.query(CHECKINS).eq('memberId', memberId).limit(1000).find(OPTIONS)).items;
}

export async function previewRecommendations(entry) {
  const outcome = clean(entry.selectedOutcome);
  const category = clean(entry.selectedCategory, 40);
  const ids = ROUTES[outcome] || [];
  if (!outcome || !category || !ids.length) throw new Error('invalid_recommendation_preview');
  const skills = await Promise.all(ids.map(id => wixData.get(SKILLS, id, OPTIONS)));
  if (skills.some(skill => !skill || skill.isPublished === false || skill.active === false || skill.category !== category)) throw new Error('canonical_skill_unavailable');
  return { recommendations: skills.map(skill => skillPayload(skill, serverRationale(outcome, skill))) };
}

export async function startLoop(memberId, entry) {
  const submissionId = clean(entry.submissionId, 120);
  if (submissionId) {
    const replay = await wixData.query(CHECKINS)
      .eq('memberId', memberId)
      .eq('submissionId', submissionId)
      .limit(1)
      .find(OPTIONS);
    const existingSubmission = replay.items[0];
    if (existingSubmission) {
      return {
        checkinId: existingSubmission._id,
        idempotentReplay: true,
        alreadyCompletedToday: existingSubmission.loopStatus === 'complete'
      };
    }
  }
  const items = await memberItems(memberId);
  const active = items.find(item => item.loopVersion === 'decision-loop-v1' && item.loopStatus !== 'complete');
  if (active) return { checkinId: active._id, resumedExisting: true };
  const today = dateKey(entry.date || new Date());
  if (!today || !entry.noticeSelection || !entry.understandInfluence || !entry.understandPriority || !entry.selectedCategory || !entry.selectedOutcome) throw new Error('invalid_loop');
  const sameDay = items.find(item => dateKey(item.date) === today);
  if (sameDay?.loopVersion === 'decision-loop-v1' && sameDay.loopStatus === 'complete') {
    return { checkinId: sameDay._id, alreadyCompletedToday: true };
  }
  const noSkill = entry.completeWithoutSkill === true || entry.practiceAction === 'no_skill';
  const allowed = ROUTES[entry.selectedOutcome] || [];
  if (!noSkill && !allowed.includes(entry.selectedSkillId)) throw new Error('unapproved_skill_route');
  let skill;
  if (!noSkill) {
    skill = await wixData.get(SKILLS, entry.selectedSkillId, OPTIONS);
    if (!skill || skill.isPublished === false || skill.active === false || skill.category !== entry.selectedCategory) throw new Error('canonical_skill_unavailable');
  }
  const item = sameDay || {};
  const approvedRationale = noSkill ? '' : serverRationale(entry.selectedOutcome, skill);
  Object.assign(item, {
    memberId,
    date: dateValue(today),
    loopVersion: 'decision-loop-v1',
    loopStatus: noSkill ? 'complete' : 'recommended',
    submissionId,
    noticeSelection: clean(entry.noticeSelection),
    emotion: clean(entry.emotion, 80),
    feeling: clean(entry.emotion, 80),
    intensityBefore: number1to10(entry.intensityBefore),
    understandInfluence: clean(entry.understandInfluence),
    understandPriority: clean(entry.understandPriority),
    selectedCategory: clean(entry.selectedCategory, 40),
    selectedOutcome: clean(entry.selectedOutcome),
    recommendedSkillIds: noSkill ? [] : allowed,
    selectedSkillId: noSkill ? '' : skill._id,
    selectedSkillTitleSnapshot: noSkill ? '' : clean(skill.name),
    selectedSkillPracticeUrlSnapshot: noSkill ? '' : canonicalUrl(skill),
    recommendationRationaleSnapshot: approvedRationale,
    practiceAction: noSkill ? 'no_skill' : clean(entry.practiceAction, 40),
    learnResult: '',
    carryForward: '',
    completedDate: noSkill ? new Date() : undefined
  });
  delete item.intensityAfter;
  delete item.privateReflection;
  delete item.reflectionSaved;
  const saved = item._id ? await wixData.update(CHECKINS, item, OPTIONS) : await wixData.insert(CHECKINS, item, OPTIONS);
  return { checkinId: saved._id, recommendedSkill: noSkill ? null : skillPayload(skill, item.recommendationRationaleSnapshot), completedWithoutSkill: noSkill };
}

export async function updateStatus(memberId, checkinId, status) {
  if (!STATUSES.includes(status)) throw new Error('invalid_status');
  const item = await owned(memberId, checkinId);
  if (item.loopStatus === 'complete') return { checkinId: item._id };
  item.loopStatus = status;
  await wixData.update(CHECKINS, item, OPTIONS);
  return { checkinId: item._id };
}

export async function completeLoop(memberId, entry, dismissed) {
  const item = await owned(memberId, entry.checkinId);
  item.loopStatus = 'complete';
  item.learnResult = dismissed ? '' : clean(entry.learnResult);
  item.intensityAfter = dismissed ? undefined : number1to10(entry.intensityAfter);
  item.carryForward = dismissed ? '' : clean(entry.carryForward);
  item.completedDate = new Date();
  if (!dismissed && entry.reflectionSaved === true) {
    item.privateReflection = clean(entry.privateReflection, 600);
    item.reflectionSaved = true;
  }
  await wixData.update(CHECKINS, item, OPTIONS);
  return { checkinId: item._id };
}

async function owned(memberId, id) {
  if (!id) throw new Error('missing_checkin_id');
  const result = await wixData.query(CHECKINS).eq('_id', id).eq('memberId', memberId).limit(1).find(OPTIONS);
  if (!result.items[0]) throw new Error('checkin_not_found');
  return result.items[0];
}

export async function getReflection(memberId, id) {
  try {
    const item = await owned(memberId, id);
    return { ok: true, checkinId: item._id, reflectionSaved: item.reflectionSaved === true, privateReflection: item.reflectionSaved === true ? clean(item.privateReflection, 600) : '' };
  } catch (error) { return { ok: false, error: 'reflection_not_found' }; }
}

export async function getPendingLoop(memberId) {
  const items = await memberItems(memberId);
  const item = items.filter(x => x.loopVersion === 'decision-loop-v1' && x.loopStatus !== 'complete').sort((a, b) => new Date(b._updatedDate).getTime() - new Date(a._updatedDate).getTime())[0];
  if (!item) return null;
  let selectedSkill = null;
  if (item.selectedSkillId) {
    try { selectedSkill = skillPayload(await wixData.get(SKILLS, item.selectedSkillId, OPTIONS), item.recommendationRationaleSnapshot); } catch (error) { selectedSkill = null; }
  }
  return {
    checkinId: item._id,
    loopStatus: item.loopStatus,
    noticeSelection: item.noticeSelection,
    emotion: item.emotion || '',
    intensityBefore: item.intensityBefore,
    understandInfluence: item.understandInfluence,
    understandPriority: item.understandPriority,
    selectedCategory: item.selectedCategory,
    selectedOutcome: item.selectedOutcome,
    selectedSkill
  };
}

function skillPayload(skill, reason) {
  if (!skill) return null;
  return { id: skill._id, title: skill.name, category: skill.category, practiceUrl: canonicalUrl(skill), shortBenefit: skill.shortBenefit || skill.description || '', reason: reason || '' };
}
function canonicalUrl(skill) { const value = skill.practiceUrl || skill['link-skills-1-name'] || `/skills-hub/${skill.slug}`; return String(value).startsWith('/skills-hub/') ? `https://www.whattodo.coach${value}` : value; }
function serverRationale(outcome, skill) { const approved = APPROVED_RATIONALES[outcome]?.[skill?._id]; if (!approved || !(ROUTES[outcome] || []).includes(skill._id)) throw new Error('unapproved_rationale_route'); return `You said you want to ${String(outcome).toLowerCase()}. This skill helps you ${approved}.`; }

async function saveLegacy(memberId, entry) {
  if (!entry.emotion || !entry.feeling) throw new Error('invalid_checkin');
  const day = dateKey(entry.date || new Date());
  const items = await memberItems(memberId);
  const item = items.find(x => dateKey(x.date) === day) || {};
  Object.assign(item, { memberId, date: dateValue(day), emotion: clean(entry.emotion, 80), feeling: clean(entry.feeling, 80) });
  const saved = item._id ? await wixData.update(CHECKINS, item, OPTIONS) : await wixData.insert(CHECKINS, item, OPTIONS);
  return { checkinId: saved._id };
}

export async function getCheckins(memberId) {
  const items = await memberItems(memberId);
  return items.map(item => ({ date: dateKey(item.date), emotion: item.emotion || '', feeling: item.feeling || item.emotion || '', loopStatus: item.loopStatus || '', selectedOutcome: item.selectedOutcome || '', selectedSkillTitle: item.selectedSkillTitleSnapshot || '' })).filter(x => x.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
}
export async function getValues(memberId) {
  const item = (await wixData.query(VALUES).eq('memberId', memberId).limit(1).find(OPTIONS)).items[0];
  return item ? [item.value1, item.value2, item.value3].map(x => clean(x, 80)).filter(Boolean).slice(0, 3) : [];
}
export async function getStacks(memberId) {
  return (await wixData.query(STACKS).eq('memberId', memberId).limit(100).find(OPTIONS)).items.map(item => ({ skillId: item.skillId || '', skillName: item.skillName || item.title || '', status: item.status || '' }));
}
