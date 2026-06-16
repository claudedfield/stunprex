'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Games auth context — the "open to play, register to keep" pattern.
 * Anyone can play every game. Saving scores + tracking progress requires a
 * free account. The server route reads the session and passes `isAuthed`;
 * games read it via useGamesAuth() to decide whether to persist and what to
 * show after a round. No game is ever gated from being played.
 */
const GamesAuthContext = createContext<{ isAuthed: boolean }>({ isAuthed: false });

export function GamesAuthProvider({
  isAuthed,
  children,
}: {
  isAuthed: boolean;
  children: ReactNode;
}) {
  return (
    <GamesAuthContext.Provider value={{ isAuthed }}>
      {children}
    </GamesAuthContext.Provider>
  );
}

export function useGamesAuth() {
  return useContext(GamesAuthContext);
}
