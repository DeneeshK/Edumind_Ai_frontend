import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api/client";
import Button from "../components/common/Button";

const slides = [
  {
    title: "Courses Built for Your Learning Style",
    subtitle:
      "AI designs your course from your goals, pace, prior knowledge, and the way you learn best.",
    image: "/images/slideshow-learning-style.png",
    alt: "Personalized course path dashboard showing learner profile, course sequence, AI personalization, and recommended pace",
  },
  {
    title: "Follows Your Path, Adapts as You Learn",
    subtitle:
      "AI updates your next steps, skips what you know, and focuses on what you need next.",
    image: "/images/slideshow-adaptive-path.png",
    alt: "Adaptive learning path dashboard showing completed lessons, skipped topics, focus areas, next recommendation, and learner performance",
  },
  {
    title: "Evaluates Like a Real Mentor",
    subtitle:
      "AI analyzes answers, finds shallow understanding, tracks progress, and gives the right practice before moving forward.",
    image: "/images/slideshow-mentor-evaluation.png",
    alt: "Assessment dashboard showing evaluation results, concept depth, weak topics, learning analytics, and recommended practice",
  },
  {
    title: "Meetings Become Learnable Notes",
    subtitle:
      "Turn Google Meet sessions into structured notes, doubts, Q&A, and flashcards.",
    image: "/images/slideshow-google-meet.png",
    alt: "Google Meet session being transformed into learnable notes, doubts, Q&A, and flashcards",
  },
  {
    title: "YouTube & PDFs Become Study Kits",
    subtitle:
      "Convert videos and PDFs into notes, MCQs, flashcards, summaries, and PDF Q&A.",
    image: "/images/slideshow-youtube-pdf.png",
    alt: "YouTube links and PDFs being converted into notes, MCQs, flashcards, and PDF question answering",
  },
];

const headingFirstPart = "Build Your Own AI Course,";
const headingHighlightPart = "Matched to Your Learning Style";
const headingFullText = `${headingFirstPart} ${headingHighlightPart}`;

function TypingHeading() {
  const [typedCount, setTypedCount] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const totalLength = headingFullText.length;

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = () => setReducedMotion(motionQuery.matches);

    handleMotionChange();
    motionQuery.addEventListener("change", handleMotionChange);

    return () => motionQuery.removeEventListener("change", handleMotionChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setTypedCount(totalLength);
      return undefined;
    }

    if (typedCount >= totalLength) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setTypedCount((current) => Math.min(current + 1, totalLength));
    }, 42);

    return () => window.clearTimeout(timer);
  }, [reducedMotion, typedCount, totalLength]);

  const typedFirstPart = headingFullText
    .slice(0, typedCount)
    .slice(0, headingFirstPart.length);
  const typedHighlightPart = headingFullText
    .slice(0, typedCount)
    .slice(headingFirstPart.length + 1);
  const typingComplete = typedCount >= totalLength;
  const typingFirstLine = typedCount <= headingFirstPart.length;

  return (
    <h2
      className="min-h-[5.6rem] text-3xl font-black leading-tight tracking-normal text-slate-950 sm:min-h-[6.1rem] sm:text-4xl"
      aria-label={headingFullText}
    >
      <span aria-hidden="true">
        <span className="block">
          {typedFirstPart}
          {!typingComplete && typingFirstLine && (
            <span className="login-typing-cursor ml-1 inline-block h-8 w-1 translate-y-1 rounded-full bg-mint sm:h-9" />
          )}
        </span>
        <span className="block text-mint">
          {typedHighlightPart}
          {!typingComplete && !typingFirstLine && (
            <span className="login-typing-cursor ml-1 inline-block h-8 w-1 translate-y-1 rounded-full bg-mint sm:h-9" />
          )}
        </span>
      </span>
    </h2>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = slides[activeSlide];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  function handleLogin() {
    setLoading(true);
    setError("");
    try {
      window.location.href = `${API_BASE_URL}/auth/google/login`;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-[-8rem] top-[-10rem] h-80 w-80 rounded-full bg-mint/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] h-96 w-96 rounded-full bg-amber/20 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[88rem] items-center gap-8 lg:grid-cols-[minmax(22rem,0.43fr)_minmax(0,0.57fr)] lg:gap-7 xl:gap-8">
        <section className="relative flex w-full flex-col items-start lg:min-h-[calc(100vh-4rem)] lg:self-stretch lg:justify-self-start lg:pt-10">
          <div className="relative z-20 flex w-full max-w-[34rem] flex-col items-start">
            <h1
              className="text-[3.5rem] font-black tracking-normal text-slate-100 sm:text-[4.5rem] lg:text-[5.35rem]"
              aria-label="EduMindai.org"
            >
              <span className="dashboard-brand-visual" aria-hidden="true">
                <span>EduMind</span>
                <span className="dashboard-brand-ai-glow text-mint">a</span>
                <span className="dashboard-brand-i dashboard-brand-ai-glow">
                  <span className="dashboard-brand-i-spacer">i</span>
                  <span className="dashboard-brand-i-stem">i</span>
                  <span className="dashboard-brand-i-dot" />
                </span>
                <span className="text-[0.5em] text-slate-950">.org</span>
              </span>
            </h1>
            <div className="mt-6">
              <TypingHeading />
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                Edumind understands what you want to learn, how you learn, and how much time you have - then creates a course that adapts after every evaluation.
              </p>
            </div>

            <div className="mt-[1.1in] w-full max-w-md">
              <Button
                className="h-12 w-full border border-mint/30 bg-slate-950 text-white shadow-[0_0_24px_rgba(124,58,237,0.28),0_16px_34px_rgba(15,23,42,0.18)] hover:border-mint/70 hover:bg-mint hover:shadow-[0_0_34px_rgba(124,58,237,0.45),0_18px_38px_rgba(15,23,42,0.2)]"
                variant="secondary"
                onClick={handleLogin}
                disabled={loading}
              >
                <img
                  src="/images/google_logo.svg"
                  alt=""
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                {loading ? "Signing in" : "Continue with Google"}
              </Button>
              {error && <p className="mt-4 text-sm text-rose">{error}</p>}
            </div>

            <div className="mt-[0.7in] rounded-xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_45px_rgba(124,58,237,0.12)] backdrop-blur-xl">
              <h3 className="text-2xl font-black leading-tight tracking-normal text-slate-950">
                What Edumind does
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                Edumind is an AI-powered learning workspace that creates personalized courses from a student's intent, prior knowledge, pace, available time, and preferred learning style. It builds a learning path around the student, evaluates understanding after each module, detects weak areas, and updates the next steps automatically.
              </p>
              <p className="mt-3 max-w-lg text-sm font-black leading-6 text-mint">
                A constantly evolving AI-generated course - built around the learner.
              </p>

              <h3 className="mt-6 text-2xl font-black leading-tight tracking-normal text-slate-950">
                Turn your <span className="text-mint">Google Meet, Youtube links, pdf</span> into Study Materials
              </h3>
            </div>
          </div>
        </section>

        <section className="relative z-10 w-full lg:self-center lg:justify-self-end" aria-label="EduMind feature carousel">
          <div className="login-showcase-glow relative overflow-hidden rounded-xl p-[2px] shadow-[0_28px_90px_rgba(79,70,229,0.18)]">
            <div className="relative z-10 flex flex-col overflow-hidden rounded-xl border border-white/70 bg-white/85 backdrop-blur-xl">
              <div className="relative flex flex-col overflow-hidden rounded-xl border border-mint/10 bg-[#f8f4ff]">
                <div className="relative aspect-[1491/1055] w-full overflow-hidden rounded-xl bg-[#f8f4ff]">
                  <img
                    key={slide.image}
                    src={slide.image}
                    alt={slide.alt}
                    className="block h-full w-full rounded-xl object-cover object-right"
                    width="1491"
                    height="1055"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
