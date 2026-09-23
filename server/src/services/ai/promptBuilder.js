'use strict';
/**
 * promptBuilder.js
 * Constructs structured, high-quality prompts for each AI content generation task.
 * Prompts enforce:
 *  - JSON output format
 *  - No invented facts (only transforms supplied information)
 *  - Professional corporate-event language
 *  - Concise, structured output
 */

/**
 * Sanitizes a string for safe embedding in a prompt.
 * Prevents prompt injection via untrusted user input.
 */
function sanitize(str) {
  if (!str) return '';
  return String(str)
    .replace(/```/g, '')       // Remove code fences that could confuse the model
    .replace(/\n{3,}/g, '\n\n') // Collapse excessive line breaks
    .slice(0, 1500);             // Hard cap per field
}

/**
 * Build the base system instruction prefixed to every prompt.
 */
function systemInstruction() {
  return `You are an expert corporate event copywriter for a professional event management platform.
Rules you MUST follow:
1. ONLY use the information provided to you. DO NOT invent titles, credentials, statistics, or facts.
2. Write in professional, polished corporate English suitable for business conferences.
3. Be concise and structured. Avoid filler phrases like "In today's fast-paced world".
4. Return ONLY valid JSON matching the requested schema. Do not wrap in markdown code fences.
5. If a field has insufficient information, make it concise but do not fabricate details.\n\n`;
}

/**
 * Event Description Generator
 * @param {{ name, eventType, topic, targetAudience, objectives, keyThemes }} input
 */
function buildEventDescriptionPrompt(input) {
  const { name, eventType, topic, targetAudience, objectives, keyThemes } = input;

  return systemInstruction() + `Generate a professional event description for the following corporate event.

EVENT INFORMATION:
- Event Name: ${sanitize(name)}
- Event Type: ${sanitize(eventType)}
- Topic / Theme: ${sanitize(topic)}
- Target Audience: ${sanitize(targetAudience)}
- Objectives: ${sanitize(objectives)}
- Key Themes: ${sanitize(keyThemes)}

Return a JSON object with exactly this structure:
{
  "description": "A 3-4 paragraph professional event description (150-250 words total)",
  "shortSummary": "A one-sentence summary suitable for event listings (max 30 words)",
  "highlights": ["highlight 1", "highlight 2", "highlight 3", "highlight 4"]
}`;
}

/**
 * Speaker Bio Generator
 * @param {{ name, designation, company, expertise, experience, providedBio }} input
 */
function buildSpeakerBioPrompt(input) {
  const { name, designation, company, expertise, experience, providedBio } = input;

  return systemInstruction() + `Polish and reformat the following speaker information into a professional third-person biography.

SPEAKER INFORMATION PROVIDED:
- Full Name: ${sanitize(name)}
- Designation / Title: ${sanitize(designation)}
- Company / Organization: ${sanitize(company)}
- Areas of Expertise: ${sanitize(expertise)}
- Years of Experience / Background: ${sanitize(experience)}
- Original Bio / Notes: ${sanitize(providedBio)}

IMPORTANT: Do not invent degrees, awards, companies, or dates not mentioned above.
Transform only the information provided into polished professional language.

Return a JSON object with exactly this structure:
{
  "bio": "A 2-3 paragraph polished third-person professional biography (100-180 words)",
  "shortBio": "A single concise sentence bio for event programs (max 25 words)"
}`;
}

/**
 * Announcement Generator
 * @param {{ eventName, purpose, audience, keyInfo }} input
 */
function buildAnnouncementPrompt(input) {
  const { eventName, purpose, audience, keyInfo } = input;

  return systemInstruction() + `Draft a professional event announcement for the following context.

ANNOUNCEMENT CONTEXT:
- Event Name: ${sanitize(eventName)}
- Announcement Purpose: ${sanitize(purpose)}
- Target Audience: ${sanitize(audience)}
- Key Information to Include: ${sanitize(keyInfo)}

Return a JSON object with exactly this structure:
{
  "title": "A clear, attention-grabbing announcement title (max 12 words)",
  "message": "The full announcement body — professional, clear, and action-oriented (80-150 words)"
}`;
}

/**
 * Session Summary Generator
 * @param {{ title, description, speakers, objectives, topics }} input
 */
function buildSessionSummaryPrompt(input) {
  const { title, description, speakers, objectives, topics } = input;

  return systemInstruction() + `Generate attendee-friendly session content for the following conference session.

SESSION INFORMATION:
- Session Title: ${sanitize(title)}
- Session Description / Notes: ${sanitize(description)}
- Speakers / Presenters: ${sanitize(speakers)}
- Learning Objectives: ${sanitize(objectives)}
- Topics Covered: ${sanitize(topics)}

Return a JSON object with exactly this structure:
{
  "summary": "A concise session summary for the event program (60-100 words)",
  "attendeeDescription": "An engaging attendee-friendly description explaining why they should attend (50-80 words)",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"]
}`;
}

module.exports = {
  buildEventDescriptionPrompt,
  buildSpeakerBioPrompt,
  buildAnnouncementPrompt,
  buildSessionSummaryPrompt
};
