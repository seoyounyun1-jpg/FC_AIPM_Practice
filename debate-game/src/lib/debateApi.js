import { anthropic, ANTHROPIC_MODEL } from './anthropicClient.js';
import { buildOpponentSystemPrompt, buildHintSystemPrompt } from '../prompts/debatePrompts.js';

function extractText(response) {
  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock?.text ?? '';
}

/** AI 논객 응답 생성 — 채점(judgingApi)과 반드시 별도 API 호출로 분리한다. */
export async function getOpponentReply({ topic, persona, weakness, turns }) {
  const system = buildOpponentSystemPrompt({
    topicTitle: topic.title,
    topicDescription: topic.description,
    persona,
    weakness,
  });

  const messages = turns.map((t) => ({
    role: t.speaker === 'user' ? 'user' : 'assistant',
    content: t.content,
  }));

  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 800,
    system,
    messages,
  });

  return extractText(response);
}

export async function getHint({ topic, persona, turns }) {
  const conversation = turns
    .map((t) => `${t.speaker === 'user' ? '유저' : '상대'}: ${t.content}`)
    .join('\n');

  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 200,
    system: buildHintSystemPrompt(),
    messages: [
      {
        role: 'user',
        content: `주제: ${topic.title}\n상대 페르소나: ${persona}\n\n지금까지 대화:\n${conversation || '(아직 대화 없음)'}\n\n다음 유저 턴을 위한 힌트를 주세요.`,
      },
    ],
  });

  return extractText(response);
}
