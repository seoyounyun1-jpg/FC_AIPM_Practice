import Anthropic from '@anthropic-ai/sdk';

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

export const isAnthropicConfigured = Boolean(apiKey);

if (!isAnthropicConfigured) {
  console.warn(
    '[anthropicClient] VITE_ANTHROPIC_API_KEY가 설정되지 않았습니다. .env를 확인하세요.',
  );
}

// 로컬 프로토타입 단계: 브라우저에서 직접 Anthropic API를 호출한다(dangerouslyAllowBrowser).
// 실제 배포 전에는 반드시 서버리스 함수 등으로 키를 서버 사이드로 옮겨야 한다.
export const anthropic = new Anthropic({
  apiKey: apiKey || 'placeholder-anthropic-key',
  dangerouslyAllowBrowser: true,
});

export const ANTHROPIC_MODEL = 'claude-opus-4-8';
