import { useState, useCallback, useEffect } from "react";

const ONBOARDING_KEY = "onboarding_state";

interface OnboardingState {
  welcomeCompleted: boolean;
  tourCompleted: boolean;
  checklist: {
    createTask: boolean;
    editTask: boolean;
    filterTasks: boolean;
    viewProfile: boolean;
    useChat: boolean;
  };
}

const defaultState: OnboardingState = {
  welcomeCompleted: false,
  tourCompleted: false,
  checklist: {
    createTask: false,
    editTask: false,
    filterTasks: false,
    viewProfile: false,
    useChat: false,
  },
};

function loadState(): OnboardingState {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch {}
  return defaultState;
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(loadState);

  useEffect(() => {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  }, [state]);

  const completeWelcome = useCallback(() => {
    setState((s) => ({ ...s, welcomeCompleted: true }));
  }, []);

  const completeTour = useCallback(() => {
    setState((s) => ({ ...s, tourCompleted: true }));
  }, []);

  const completeChecklistItem = useCallback((key: keyof OnboardingState["checklist"]) => {
    setState((s) => ({
      ...s,
      checklist: { ...s.checklist, [key]: true },
    }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setState(defaultState);
  }, []);

  const checklistProgress = Object.values(state.checklist).filter(Boolean).length;
  const checklistTotal = Object.keys(state.checklist).length;
  const isOnboardingComplete = state.welcomeCompleted && state.tourCompleted && checklistProgress === checklistTotal;

  return {
    ...state,
    completeWelcome,
    completeTour,
    completeChecklistItem,
    resetOnboarding,
    checklistProgress,
    checklistTotal,
    isOnboardingComplete,
  };
}
