import { MIN_INTERESTS, MAX_INTERESTS, INTEREST_TAGS } from '../data/constants.js';

const MAX_NICKNAME_LENGTH = 20;

export function validateNickname(nickname) {
  const trimmed = (nickname ?? '').trim();
  if (trimmed.length === 0) {
    return { valid: false, error: '닉네임을 입력해주세요.' };
  }
  if (trimmed.length > MAX_NICKNAME_LENGTH) {
    return { valid: false, error: `닉네임은 ${MAX_NICKNAME_LENGTH}자 이내로 입력해주세요.` };
  }
  return { valid: true, error: null };
}

export function validateInterestSelection(selectedTags) {
  const unique = new Set(selectedTags ?? []);

  if ([...unique].some((tag) => !INTEREST_TAGS.includes(tag))) {
    return { valid: false, error: '알 수 없는 관심사 태그가 포함되어 있습니다.' };
  }
  if (unique.size < MIN_INTERESTS) {
    return { valid: false, error: `관심사를 최소 ${MIN_INTERESTS}개 이상 선택해주세요.` };
  }
  if (unique.size > MAX_INTERESTS) {
    return { valid: false, error: `관심사는 최대 ${MAX_INTERESTS}개까지 선택할 수 있습니다.` };
  }
  return { valid: true, error: null };
}

// interest_profile jsonb 저장 형식: [{ tag, weight }]
// 온보딩 단계에서는 선택된 태그 모두 동일 가중치(1)로 시작한다.
export function buildInterestProfile(selectedTags) {
  return [...new Set(selectedTags ?? [])].map((tag) => ({ tag, weight: 1 }));
}

export function toggleTagSelection(selectedTags, tag) {
  const set = new Set(selectedTags ?? []);
  if (set.has(tag)) {
    set.delete(tag);
  } else {
    if (set.size >= MAX_INTERESTS) {
      return selectedTags; // 이미 최대치면 변경 없음
    }
    set.add(tag);
  }
  return [...set];
}
