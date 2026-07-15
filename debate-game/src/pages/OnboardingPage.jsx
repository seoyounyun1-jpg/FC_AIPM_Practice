import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INTEREST_TAGS, MIN_INTERESTS, MAX_INTERESTS } from '../data/constants.js';
import {
  validateNickname,
  validateInterestSelection,
  buildInterestProfile,
  toggleTagSelection,
} from '../lib/onboardingValidation.js';
import { createUser } from '../lib/usersApi.js';
import { setLocalUserId } from '../lib/localUser.js';
import { isSupabaseConfigured } from '../lib/supabaseClient.js';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const interestCheck = validateInterestSelection(selectedTags);

  function handleToggleTag(tag) {
    setSelectedTags((prev) => toggleTagSelection(prev, tag));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const nicknameCheck = validateNickname(nickname);
    if (!nicknameCheck.valid) {
      setError(nicknameCheck.error);
      return;
    }
    if (!interestCheck.valid) {
      setError(interestCheck.error);
      return;
    }

    setSubmitting(true);
    try {
      const user = await createUser({
        nickname: nickname.trim(),
        interestProfile: buildInterestProfile(selectedTags),
      });
      setLocalUserId(user.id);
      navigate('/home', { replace: true });
    } catch (err) {
      console.error('[OnboardingPage] createUser 실패', err);
      setError('사용자 생성에 실패했습니다. Supabase 연결 설정을 확인해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          AI 논쟁 게임에 오신 걸 환영합니다
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          닉네임과 관심사를 선택하면 맞춤 주제를 추천해드려요.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <p className="rounded border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Supabase 환경변수가 설정되지 않아 저장은 실패합니다. .env 설정 후 다시 시도해주세요.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="nickname" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            닉네임
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="예: 논리왕"
            maxLength={20}
            className="rounded border border-neutral-300 px-3 py-2 outline-none focus:border-violet-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              관심사 ({MIN_INTERESTS}~{MAX_INTERESTS}개 선택)
            </span>
            <span className="text-sm text-neutral-500">{selectedTags.length}/{MAX_INTERESTS}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {INTEREST_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  aria-pressed={isSelected}
                  className={
                    'rounded-full border px-4 py-2 text-sm transition-colors ' +
                    (isSelected
                      ? 'border-violet-500 bg-violet-500 text-white'
                      : 'border-neutral-300 text-neutral-700 hover:border-violet-400 dark:border-neutral-700 dark:text-neutral-300')
                  }
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !interestCheck.valid}
          className="rounded bg-violet-600 px-4 py-3 font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? '시작하는 중...' : '시작하기'}
        </button>
      </form>
    </div>
  );
}
