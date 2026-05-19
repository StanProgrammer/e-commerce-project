import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import getApiErrorMessage from "../utils/getApiErrorMessage";
import getBaseUrl from "../utils/baseUrl";
import { feedbackApi } from "../store/features/feedback/feedbackApi";

const FEEDBACK_TYPES = {
  bug: {
    label: "Bug Report",
    icon: "ri-bug-line",
    titlePlaceholder: "What is broken?",
    descriptionPlaceholder: "What happened? Add steps to reproduce, expected result, and actual result.",
  },
  feature: {
    label: "Feature Request",
    icon: "ri-lightbulb-flash-line",
    titlePlaceholder: "What should we build?",
    descriptionPlaceholder: "Describe the idea, who it helps, and what a great version would do.",
  },
};

const FEEDBACK_POSITION_KEY = "feedback-widget-position";
const FEEDBACK_CLOSE_TRANSITION_MS = 180;
const EMPTY_FORM_DATA = {
  bug: { title: "", description: "" },
  feature: { title: "", description: "" },
};

const readSavedPosition = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedPosition = window.localStorage.getItem(FEEDBACK_POSITION_KEY);
    if (!savedPosition) {
      return null;
    }

    const parsedPosition = JSON.parse(savedPosition);
    if (
      typeof parsedPosition?.x === "number" &&
      typeof parsedPosition?.y === "number"
    ) {
      return parsedPosition;
    }
  } catch {
    return null;
  }

  return null;
};

const getInitialPosition = () => {
  if (typeof window === "undefined") {
    return { x: 24, y: 420 };
  }

  const savedPosition = readSavedPosition();
  if (savedPosition) {
    return savedPosition;
  }

  return {
    x: 28,
    y: Math.max(120, window.innerHeight - 190),
  };
};

const clampPosition = (position, node) => {
  if (typeof window === "undefined" || !node) {
    return position;
  }

  return clampPositionBySize(position, node.offsetWidth, node.offsetHeight);
};

const clampPositionBySize = (position, width, height) => {
  if (typeof window === "undefined") {
    return position;
  }

  const margin = 12;
  const maxX = Math.max(margin, window.innerWidth - width - margin);
  const maxY = Math.max(margin, window.innerHeight - height - margin);

  return {
    x: Math.min(Math.max(position.x, margin), maxX),
    y: Math.min(Math.max(position.y, margin), maxY),
  };
};

const getPanelAdjustedPosition = (position) => {
  if (typeof window === "undefined") {
    return position;
  }

  const margin = 12;
  const panelWidth = Math.min(360, window.innerWidth - margin * 2);
  const panelHeight = Math.min(460, window.innerHeight - margin * 2);

  return {
    x: Math.min(Math.max(position.x, margin), window.innerWidth - panelWidth - margin),
    y: Math.min(Math.max(position.y, margin), window.innerHeight - panelHeight - margin),
  };
};

const FeedbackWidget = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const widgetRef = useRef(null);
  const dragState = useRef(null);
  const dragMoved = useRef(false);
  const savedLauncherPosition = useRef(getInitialPosition());
  const closeTimer = useRef(null);
  const isClosingRef = useRef(false);
  const [position, setPosition] = useState(getInitialPosition);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeType, setActiveType] = useState("bug");
  const [formData, setFormData] = useState(EMPTY_FORM_DATA);
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      savedLauncherPosition.current = clampPositionBySize(
        savedLauncherPosition.current,
        62,
        62
      );
      setPosition((current) => clampPosition(current, widgetRef.current));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!widgetRef.current?.contains(event.target)) {
        closeFeedback();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeFeedback();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        FEEDBACK_POSITION_KEY,
        JSON.stringify(savedLauncherPosition.current)
      );
    } catch {
      // Local storage may be unavailable in private or restricted contexts.
    }
  }, [position]);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    setPosition((current) => clampPosition(current, widgetRef.current));
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !widgetRef.current || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      setPosition((current) => clampPosition(current, widgetRef.current));
    });

    observer.observe(widgetRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  const resetFeedbackSession = () => {
    setActiveType("bug");
    setSubmittedMessage("");
    setSubmitStatus("idle");
    setIsSubmitting(false);
    setFormData(EMPTY_FORM_DATA);
  };

  const startDrag = (event) => {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragMoved.current = false;
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
  };

  const moveDrag = (event) => {
    if (!dragState.current || dragState.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.current.startX;
    const deltaY = event.clientY - dragState.current.startY;

    if (Math.abs(deltaX) + Math.abs(deltaY) > 5) {
      dragMoved.current = true;
    }

    const nextPosition = clampPosition(
      {
        x: dragState.current.originX + deltaX,
        y: dragState.current.originY + deltaY,
      },
      widgetRef.current
    );

    savedLauncherPosition.current = nextPosition;
    setPosition(nextPosition);
  };

  const endDrag = (event) => {
    if (dragState.current?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      dragState.current = null;
    }
  };

  const handleLauncherClick = () => {
    if (dragMoved.current) {
      dragMoved.current = false;
      return;
    }

    resetFeedbackSession();
    isClosingRef.current = false;
    setIsClosing(false);
    setPosition(getPanelAdjustedPosition(savedLauncherPosition.current));
    setIsOpen(true);
  };

  const handleLauncherKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      resetFeedbackSession();
      isClosingRef.current = false;
      setIsClosing(false);
      setPosition(getPanelAdjustedPosition(savedLauncherPosition.current));
      setIsOpen(true);
    }
  };

  const closeFeedback = (event) => {
    event?.stopPropagation();
    if (!isOpen || isClosingRef.current) {
      return;
    }

    dragState.current = null;
    dragMoved.current = false;
    isClosingRef.current = true;
    setIsClosing(true);

    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }

    closeTimer.current = setTimeout(() => {
      resetFeedbackSession();
      setPosition(savedLauncherPosition.current);
      setIsOpen(false);
      isClosingRef.current = false;
      setIsClosing(false);
      closeTimer.current = null;
    }, FEEDBACK_CLOSE_TRANSITION_MS);
  };

  const updateField = (field, value) => {
    setSubmittedMessage("");
    setSubmitStatus("idle");
    setFormData((current) => ({
      ...current,
      [activeType]: {
        ...current[activeType],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmittedMessage("");
    setSubmitStatus("idle");

    try {
      const response = await fetch(`${getBaseUrl()}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: activeType,
          title: currentForm.title,
          description: currentForm.description,
          pageUrl: window.location.href,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw data;
      }

      setSubmitStatus("success");
      setSubmittedMessage(data.message || "Feedback submitted successfully.");
      dispatch(feedbackApi.util.invalidateTags(["Feedback"]));
      setFormData((current) => ({
        ...current,
        [activeType]: { title: "", description: "" },
      }));
    } catch (error) {
      setSubmitStatus("error");
      setSubmittedMessage(
        getApiErrorMessage(error, "We could not submit your feedback. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentFeedback = FEEDBACK_TYPES[activeType];
  const currentForm = formData[activeType];
  const isPanelVisible = isOpen || isClosing;

  if (user?.role === "admin") {
    return null;
  }

  return (
    <aside
      ref={widgetRef}
      className={`feedback-widget ${isPanelVisible ? "feedback-widget--open" : ""}`}
      style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
      aria-label="Feedback"
    >
      {!isPanelVisible ? (
        <button
          type="button"
          className="feedback-launcher"
          aria-label="Open feedback"
          title="Feedback"
          onClick={handleLauncherClick}
          onKeyDown={handleLauncherKeyDown}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <i className="ri-bug-2-fill" aria-hidden="true"></i>
          <span>Feedback</span>
        </button>
      ) : (
        <section
          className={`feedback-panel ${isClosing ? "feedback-panel--closing" : ""}`}
          aria-labelledby="feedback-heading"
        >
          <header
            className="feedback-panel__header"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div>
              <span className="feedback-panel__eyebrow">Feedback</span>
              <h2 id="feedback-heading">Help us improve</h2>
            </div>
            <button
              type="button"
              className="feedback-icon-button"
              aria-label="Close feedback"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={closeFeedback}
            >
              <i className="ri-close-line" aria-hidden="true"></i>
            </button>
          </header>

          <div className="feedback-tabs" role="tablist" aria-label="Feedback type">
            {Object.entries(FEEDBACK_TYPES).map(([key, item]) => (
              <button
                key={key}
                type="button"
                className={`feedback-tab ${activeType === key ? "feedback-tab--active" : ""}`}
                role="tab"
                aria-selected={activeType === key}
                onClick={() => {
                  setSubmittedMessage("");
                  setActiveType(key);
                }}
              >
                <i className={item.icon} aria-hidden="true"></i>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <form className="feedback-form" onSubmit={handleSubmit}>
            <label className="feedback-field">
              <span>Title</span>
              <input
                type="text"
                value={currentForm.title}
                placeholder={currentFeedback.titlePlaceholder}
                onChange={(event) => updateField("title", event.target.value)}
                maxLength={90}
                required
              />
            </label>

            <label className="feedback-field">
              <span>Description</span>
              <textarea
                value={currentForm.description}
                placeholder={currentFeedback.descriptionPlaceholder}
                onChange={(event) => updateField("description", event.target.value)}
                rows={5}
                required
              />
            </label>

            <div className="feedback-actions">
              <p className="feedback-hint">Drag the header to move this anywhere.</p>
              <button type="submit" className="feedback-submit" disabled={isSubmitting}>
                <i
                  className={isSubmitting ? "ri-loader-4-line animate-spin" : "ri-send-plane-fill"}
                  aria-hidden="true"
                ></i>
                <span>{isSubmitting ? "Sending" : "Submit"}</span>
              </button>
            </div>

            {submittedMessage && (
              <p className={`feedback-message feedback-message--${submitStatus}`} role="status">
                <i
                  className={
                    submitStatus === "error"
                      ? "ri-error-warning-fill"
                      : "ri-checkbox-circle-fill"
                  }
                  aria-hidden="true"
                ></i>
                {submittedMessage}
              </p>
            )}
          </form>
        </section>
      )}
    </aside>
  );
};

export default FeedbackWidget;
