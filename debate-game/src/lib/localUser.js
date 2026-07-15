const STORAGE_KEY = 'debate_game_user_id';

export function getLocalUserId() {
  return localStorage.getItem(STORAGE_KEY);
}

export function setLocalUserId(id) {
  localStorage.setItem(STORAGE_KEY, id);
}

export function clearLocalUserId() {
  localStorage.removeItem(STORAGE_KEY);
}
