import { useCallback, useEffect, useRef, useState } from 'react';
import { getLocalUserId } from '../lib/localUser.js';
import { getUser } from '../lib/usersApi.js';
import { getTopicById, getTopicWeakness } from '../lib/topicsApi.js';
import { createRound, addTurn, updateHintCount, completeRound } from '../lib/roundsApi.js';
import { getOpponentReply, getHint } from '../lib/debateApi.js';
import { assignPersonaForTopic } from '../lib/personaAssignment.js';
import { nextTurnNumber, isRoundComplete } from '../lib/turnFlow.js';
import { MAX_HINTS_PER_ROUND } from '../data/constants.js';

/**
 * 라운드 상태 머신: loading -> ready <-> ai-thinking -> completed (| error)
 * ready 상태에서만 유저가 메시지를 보내거나 힌트를 요청할 수 있다.
 */
export function useDebateRound(topicId, personaFromState) {
  const [status, setStatus] = useState('loading');
  const [topic, setTopic] = useState(null);
  const [persona, setPersona] = useState(personaFromState ?? null);
  const [round, setRound] = useState(null);
  const [turns, setTurns] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintText, setHintText] = useState(null);
  const [error, setError] = useState(null);
  const weaknessRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const userId = getLocalUserId();
        if (!userId) throw new Error('NO_LOCAL_USER');

        const [user, topicData, weakness] = await Promise.all([
          getUser(userId),
          getTopicById(topicId),
          getTopicWeakness(topicId),
        ]);

        const resolvedPersona = personaFromState ?? assignPersonaForTopic(topicId);
        weaknessRef.current = weakness;

        const newRound = await createRound({
          userId,
          topicId,
          persona: resolvedPersona,
          tier: user.current_tier,
        });

        if (cancelled) return;
        setTopic(topicData);
        setPersona(resolvedPersona);
        setRound(newRound);
        setStatus('ready');
      } catch (err) {
        console.error('[useDebateRound] 초기화 실패', err);
        if (!cancelled) {
          setError('라운드를 시작하지 못했습니다. Supabase/Anthropic 연결 설정을 확인해주세요.');
          setStatus('error');
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [topicId, personaFromState]);

  const submitUserTurn = useCallback(
    async (content) => {
      const trimmed = content.trim();
      if (!round || status !== 'ready' || !trimmed) return;

      const userTurnNumber = nextTurnNumber(turns.length);
      setStatus('ai-thinking');
      setHintText(null);

      try {
        const userTurn = await addTurn({
          roundId: round.id,
          turnNumber: userTurnNumber,
          speaker: 'user',
          content: trimmed,
        });
        const turnsWithUser = [...turns, userTurn];
        setTurns(turnsWithUser);

        if (isRoundComplete(userTurnNumber)) {
          await completeRound(round.id);
          setStatus('completed');
          return;
        }

        const replyText = await getOpponentReply({
          topic,
          persona,
          weakness: weaknessRef.current,
          turns: turnsWithUser,
        });
        const aiTurnNumber = nextTurnNumber(turnsWithUser.length);
        const aiTurn = await addTurn({
          roundId: round.id,
          turnNumber: aiTurnNumber,
          speaker: 'ai',
          content: replyText,
        });
        const turnsWithAi = [...turnsWithUser, aiTurn];
        setTurns(turnsWithAi);

        if (isRoundComplete(aiTurnNumber)) {
          await completeRound(round.id);
          setStatus('completed');
        } else {
          setStatus('ready');
        }
      } catch (err) {
        console.error('[useDebateRound] 턴 진행 실패', err);
        setError('메시지 전송에 실패했습니다. 다시 시도해주세요.');
        setStatus('ready');
      }
    },
    [round, status, turns, topic, persona],
  );

  const requestHint = useCallback(async () => {
    if (!round || status !== 'ready' || hintsUsed >= MAX_HINTS_PER_ROUND) return;
    try {
      const hint = await getHint({ topic, persona, turns });
      setHintText(hint);
      const next = hintsUsed + 1;
      setHintsUsed(next);
      await updateHintCount(round.id, next);
    } catch (err) {
      console.error('[useDebateRound] 힌트 요청 실패', err);
    }
  }, [round, status, hintsUsed, topic, persona, turns]);

  return {
    status,
    topic,
    persona,
    turns,
    hintsUsed,
    hintText,
    error,
    submitUserTurn,
    requestHint,
  };
}
