"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import CountdownIntro from "./CountdownIntro";

/** true = 히어로 등장 시작 (카운트다운 종료). 프로바이더 밖에서는 기본 true. */
const IntroContext = createContext<boolean>(true);
export function useIntroRevealed() {
  return useContext(IntroContext);
}

export default function IntroProvider({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  const [showLeader, setShowLeader] = useState(true);

  return (
    <IntroContext.Provider value={revealed}>
      {showLeader && (
        <CountdownIntro
          onReveal={() => setRevealed(true)}
          onFinish={() => setShowLeader(false)}
        />
      )}
      {children}
    </IntroContext.Provider>
  );
}
