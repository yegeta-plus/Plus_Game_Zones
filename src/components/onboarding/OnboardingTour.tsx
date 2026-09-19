import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronLeft, X, Sparkles, Check, HelpCircle } from 'lucide-react';
import { TourStep, ONBOARDING_TOUR_STEPS, ONBOARDING_STORAGE_KEY } from './onboardingSteps';
import { NavTab } from '../../types';
import { SubViewType } from '../more/MoreHubView';
import { triggerHaptic } from '../../lib/haptics';

export { ONBOARDING_STORAGE_KEY };

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  moreSubView?: SubViewType;
  onNavigateTab: (tab: NavTab, subView?: SubViewType | string) => void;
  userId?: string;
  onCompleted?: () => void;
  customSteps?: TourStep[];
  initialStepIndex?: number;
}

interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  activeTab,
  moreSubView,
  onNavigateTab,
  userId,
  onCompleted,
  customSteps,
  initialStepIndex = 0
}) => {
  const steps = customSteps || ONBOARDING_TOUR_STEPS;
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(initialStepIndex);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const retryTimeoutRef = useRef<any>(null);

  // Reset to initial step whenever tour is freshly opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(initialStepIndex);
    }
  }, [isOpen, initialStepIndex]);

  const currentStep = steps[currentStepIndex];

  // Save tour completion to localStorage and trigger callbacks
  const handleFinishOrDismiss = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      if (userId) {
        localStorage.setItem(`${ONBOARDING_STORAGE_KEY}_${userId}`, 'true');
      }
    } catch (e) {
      console.warn('Unable to persist tour state to localStorage', e);
    }
    triggerHaptic('light');
    onClose();
    if (onCompleted) {
      onCompleted();
    }
  }, [userId, onClose, onCompleted]);

  // Position and measure the current target element
  const measureTarget = useCallback(() => {
    if (!currentStep) return;

    const el = document.querySelector(currentStep.targetSelector) as HTMLElement | null;
    if (el) {
      const rect = el.getBoundingClientRect();
      // Only set if element has actual dimensions
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        });
        return true;
      }
    }
    return false;
  }, [currentStep]);

  // Update target measurement and scroll into view
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    // Check if step requires tab or subview change
    const needsTabSwitch = currentStep.tab !== activeTab;
    const needsSubViewSwitch =
      currentStep.tab === 'more' &&
      currentStep.subView &&
      moreSubView !== currentStep.subView.toUpperCase();

    if (needsTabSwitch || needsSubViewSwitch) {
      setIsNavigating(true);
      onNavigateTab(currentStep.tab, currentStep.subView);
    }

    // Attempt to locate and scroll to target with retries
    let attempts = 0;
    const maxAttempts = 10;

    const attemptMeasurement = () => {
      const el = document.querySelector(currentStep.targetSelector) as HTMLElement | null;
      if (el) {
        // Smooth scroll element to center of viewport
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

        // Allow scroll animation to settle before measuring
        setTimeout(() => {
          const success = measureTarget();
          setIsNavigating(false);
          if (!success && attempts < maxAttempts) {
            attempts++;
            retryTimeoutRef.current = setTimeout(attemptMeasurement, 150);
          }
        }, 180);
      } else if (attempts < maxAttempts) {
        attempts++;
        retryTimeoutRef.current = setTimeout(attemptMeasurement, 150);
      } else {
        // Fallback: If element not found in DOM, center spotlight in viewport
        setIsNavigating(false);
        setTargetRect(null);
      }
    };

    const timer = setTimeout(attemptMeasurement, needsTabSwitch ? 220 : 60);

    return () => {
      clearTimeout(timer);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [isOpen, currentStepIndex, currentStep, activeTab, moreSubView, onNavigateTab, measureTarget]);

  // Listen to window resize and scroll events to re-align
  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => {
      measureTarget();
    };

    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('scroll', handleUpdate, { passive: true });

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
    };
  }, [isOpen, measureTarget]);

  // Keyboard navigation (Escape, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinishOrDismiss();
      } else if (e.key === 'ArrowRight') {
        if (currentStepIndex < steps.length - 1) {
          triggerHaptic('light');
          setCurrentStepIndex(prev => prev + 1);
        } else {
          handleFinishOrDismiss();
        }
      } else if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
        triggerHaptic('light');
        setCurrentStepIndex(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, steps.length, handleFinishOrDismiss]);

  if (!isOpen || !currentStep) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Spotlight Cutout coordinates with padding
  const pad = 6;
  const cutout = targetRect
    ? {
        x: Math.max(0, targetRect.x - pad),
        y: Math.max(0, targetRect.y - pad),
        width: targetRect.width + pad * 2,
        height: targetRect.height + pad * 2
      }
    : null;

  // Tooltip card positioning calculation
  const cardWidth = 360;
  const cardEstimatedHeight = 180;
  const windowW = typeof window !== 'undefined' ? window.innerWidth : 400;
  const windowH = typeof window !== 'undefined' ? window.innerHeight : 800;

  let cardStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    width: `min(${cardWidth}px, calc(100vw - 32px))`
  };

  let arrowPlacement: 'top' | 'bottom' | 'none' = 'none';

  if (cutout) {
    // Determine whether to place card above or below target
    const spaceBelow = windowH - (cutout.y + cutout.height);
    const spaceAbove = cutout.y;

    const preferredPlacement = currentStep.placement || (spaceBelow >= cardEstimatedHeight + 20 ? 'bottom' : 'top');
    const placeBelow = preferredPlacement === 'bottom' ? spaceBelow >= cardEstimatedHeight || spaceBelow > spaceAbove : !(spaceAbove >= cardEstimatedHeight);

    // Compute Horizontal centering aligned with target
    const targetCenterX = cutout.x + cutout.width / 2;
    const computedLeft = Math.max(16, Math.min(windowW - cardWidth - 16, targetCenterX - cardWidth / 2));

    if (placeBelow) {
      cardStyle.top = Math.min(windowH - cardEstimatedHeight - 16, cutout.y + cutout.height + 14);
      cardStyle.left = computedLeft;
      arrowPlacement = 'top';
    } else {
      cardStyle.top = Math.max(16, cutout.y - cardEstimatedHeight - 14);
      cardStyle.left = computedLeft;
      arrowPlacement = 'bottom';
    }
  } else {
    // Fallback: center in screen if target element is not found
    cardStyle.top = '50%';
    cardStyle.left = '50%';
    cardStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <div className="fixed inset-0 z-[9990] select-none">
      {/* SVG Spotlight Dimming Overlay */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto transition-opacity duration-300"
        style={{ zIndex: 9991 }}
      >
        <defs>
          <mask id="pluszone-spotlight-mask">
            {/* White background: full dim */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Cutout hole: transparent clear area over target */}
            {cutout && (
              <rect
                x={cutout.x}
                y={cutout.y}
                width={cutout.width}
                height={cutout.height}
                rx="14"
                ry="14"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Dimmed backdrop using mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.72)"
          mask="url(#pluszone-spotlight-mask)"
        />
      </svg>

      {/* Target Element Focus Ring (Indigo Accent) */}
      {cutout && (
        <div
          className="fixed pointer-events-none transition-all duration-300 ease-out rounded-2xl border-2 border-indigo-500 ring-4 ring-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.35)]"
          style={{
            zIndex: 9992,
            left: cutout.x,
            top: cutout.y,
            width: cutout.width,
            height: cutout.height
          }}
        >
          {/* Subtle animated pulse corner indicators */}
          <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-2 ring-white animate-ping" />
        </div>
      )}

      {/* Anchored Tooltip Popup Card */}
      <div
        style={cardStyle}
        className="bg-white dark:bg-[#131926] border border-indigo-100 dark:border-indigo-900/60 shadow-2xl rounded-2xl p-4 sm:p-5 space-y-3 pointer-events-auto transition-all duration-200 animate-fadeIn"
      >
        {/* Pointer Arrow Beak */}
        {arrowPlacement === 'top' && (
          <div className="absolute -top-2 left-8 w-4 h-4 bg-white dark:bg-[#131926] border-t border-l border-indigo-100 dark:border-indigo-900/60 transform rotate-45" />
        )}
        {arrowPlacement === 'bottom' && (
          <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white dark:bg-[#131926] border-b border-r border-indigo-100 dark:border-indigo-900/60 transform rotate-45" />
        )}

        {/* Header: Step Counter Badge & Close Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>Step {currentStepIndex + 1} of {steps.length}</span>
            </span>

            {currentStep.badge && (
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:inline">
                {currentStep.badge}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleFinishOrDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Tour (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Content: Title & Plain 1-2 sentence description */}
        <div className="space-y-1">
          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
            {currentStep.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
            {currentStep.description}
          </p>
        </div>

        {/* Progress Dots Indicator */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5">
            {steps.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => {
                  triggerHaptic('light');
                  setCurrentStepIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-5 bg-indigo-600 dark:bg-indigo-500'
                    : idx < currentStepIndex
                    ? 'w-2 bg-indigo-300 dark:bg-indigo-900'
                    : 'w-2 bg-slate-200 dark:bg-slate-700'
                }`}
                title={`Jump to step ${idx + 1}: ${s.title}`}
              />
            ))}
          </div>

          {/* Action Buttons: Skip, Back, Next / Finish */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFinishOrDismiss}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 transition-colors cursor-pointer"
            >
              Skip
            </button>

            {!isFirstStep && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setCurrentStepIndex(prev => Math.max(0, prev - 1));
                }}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                if (isLastStep) {
                  handleFinishOrDismiss();
                } else {
                  setCurrentStepIndex(prev => prev + 1);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer transition-all active:scale-95"
            >
              <span>{isLastStep ? 'Get Started' : 'Next'}</span>
              {isLastStep ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
