'use strict';
/**
 * aiService.test.js
 * Test suite for AI Content Generation & Session Recommendation Engine
 */

const assert = require('assert');
const {
  buildEventDescriptionPrompt,
  buildSpeakerBioPrompt,
  buildAnnouncementPrompt,
  buildSessionSummaryPrompt
} = require('../src/services/ai/promptBuilder');

async function testPromptBuilder() {
  console.log('Testing Prompt Builder...');

  const descPrompt = buildEventDescriptionPrompt({
    name: 'AI Summit 2026',
    eventType: 'Conference',
    topic: 'Artificial Intelligence',
    targetAudience: 'Developers',
    objectives: 'Learn GenAI',
    keyThemes: 'LLMs, RAG'
  });
  assert(descPrompt.includes('AI Summit 2026'), 'Prompt should include event name');
  assert(descPrompt.includes('JSON'), 'Prompt should instruct JSON output');

  const bioPrompt = buildSpeakerBioPrompt({
    name: 'Jane Doe',
    designation: 'Chief Scientist',
    company: 'AI Labs',
    expertise: 'Machine Learning',
    experience: '10 years',
    providedBio: 'Pioneer in neural networks'
  });
  assert(bioPrompt.includes('Jane Doe'), 'Bio prompt should include speaker name');

  const annPrompt = buildAnnouncementPrompt({
    eventName: 'TechConf',
    purpose: 'Keynote Announcement',
    audience: 'Attendees',
    keyInfo: 'Dr. Smith speaking at 9am'
  });
  assert(annPrompt.includes('TechConf'), 'Announcement prompt should include event name');

  const sessPrompt = buildSessionSummaryPrompt({
    title: 'Deep Learning at Scale',
    description: 'Scaling transformer models',
    speakers: 'Jane Doe',
    objectives: 'Scale training',
    topics: 'Distributed Training'
  });
  assert(sessPrompt.includes('Deep Learning at Scale'), 'Session prompt should include session title');

  console.log('✅ Prompt Builder tests passed!');
}

testPromptBuilder().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
