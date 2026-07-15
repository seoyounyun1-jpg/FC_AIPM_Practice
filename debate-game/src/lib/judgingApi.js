import { anthropic, ANTHROPIC_MODEL } from './anthropicClient.js';
import { JUDGE_SYSTEM_PROMPT, JUDGMENT_JSON_SCHEMA } from '../prompts/judgePrompt.js';

function buildTranscript(turns) {
  return turns
    .map((t) => `[턴 ${t.turn_number}] ${t.speaker === 'user' ? '유저' : 'AI 논객'}: ${t.content}`)
    .join('\n\n');
}

/**
 * 라운드 종료 후 전체 대화를 1회 호출로 3축 동시 채점(Listwise)한다.
 * 논객 응답 생성(debateApi.getOpponentReply)과는 반드시 별도의 API 호출로 분리한다
 * (자기선호 편향 방지 — 브리프 확정 원칙).
 */
export async function judgeRound({ topic, turns }) {
  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 4000,
    system: JUDGE_SYSTEM_PROMPT,
    output_config: { format: { type: 'json_schema', schema: JUDGMENT_JSON_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: `주제: ${topic.title}\n\n[대화 전체]\n${buildTranscript(turns)}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('채점 응답에서 텍스트 블록을 찾을 수 없습니다.');
  return JSON.parse(textBlock.text);
}
