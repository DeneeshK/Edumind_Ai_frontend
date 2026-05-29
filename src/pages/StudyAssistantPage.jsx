import { ArrowRight, FileText, Radio, Youtube } from "lucide-react";
import { useState } from "react";
import gmeetImage from "../assets/study/gmeet.png";
import pdfImage from "../assets/study/pdf.png";
import youtubeImage from "../assets/study/youtube.png";
import LiveClassAssistant from "../components/study/LiveClassAssistant";
import PDFNotes from "../components/study/PDFNotes";
import YouTubeNotes from "../components/study/YouTubeNotes";

const studyOptions = [
  {
    id: "live",
    title: "Google Meet Notes",
    accent: "Convert live Google Meet sessions into structured notes",
    description:
      "Capture meeting or class content and turn it into organized summaries, key points, and revision-friendly study notes.",
    action: "Create Meet Notes",
    icon: Radio,
    image: gmeetImage,
    imageAlt: "Google Meet study notes illustration",
    accentClass: "text-mint",
    iconActiveClass: "bg-mint/10 text-mint",
    buttonClass: "bg-mint text-white group-hover:bg-[#6d28d9]",
    selectedClass: "border-mint/45 shadow-glow ring-mint/20"
  },
  {
    id: "youtube",
    title: "YouTube Notes",
    accent: "Turn YouTube lessons into learnable notes",
    description:
      "Convert educational videos into structured notes, summaries, concepts, and revision material you can study from.",
    action: "Create YouTube Notes",
    icon: Youtube,
    image: youtubeImage,
    imageAlt: "YouTube video notes illustration",
    accentClass: "text-[#f97316]",
    iconActiveClass: "bg-[#f97316]/10 text-[#f97316]",
    buttonClass: "bg-[#f97316] text-white group-hover:bg-[#ea580c]",
    selectedClass: "border-[#f97316]/45 shadow-[0_18px_45px_rgba(249,115,22,0.16)] ring-[#f97316]/20"
  },
  {
    id: "pdf",
    title: "PDF Notes",
    accent: "Transform PDFs into clear study notes",
    description:
      "Upload PDFs and convert dense material into readable summaries, key points, and organized learning notes.",
    action: "Create PDF Notes",
    icon: FileText,
    image: pdfImage,
    imageAlt: "PDF study notes illustration",
    accentClass: "text-rose",
    iconActiveClass: "bg-rose/10 text-rose",
    buttonClass: "bg-rose text-white group-hover:bg-rose/85",
    selectedClass: "border-rose/45 shadow-[0_18px_45px_rgba(239,68,68,0.14)] ring-rose/20"
  }
];

export default function StudyAssistantPage() {
  const [activeTab, setActiveTab] = useState("live");
  const activeOption = studyOptions.find((option) => option.id === activeTab) || studyOptions[0];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase text-mint">Study Assistant</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-50 sm:text-4xl">Learning Notes</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
              Generate focused notes from live classes, videos, and study materials without changing your course path.
            </p>
          </div>
        </div>
      </section>

      <section
        className="grid grid-cols-1 gap-5 lg:grid-cols-3"
        role="tablist"
        aria-label="Study assistant tools"
      >
        {studyOptions.map(({
          id,
          title,
          accent,
          description,
          action,
          icon: Icon,
          image,
          imageAlt,
          accentClass,
          iconActiveClass,
          buttonClass,
          selectedClass
        }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              id={`${id}-study-option`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="study-assistant-panel"
              onClick={() => setActiveTab(id)}
              className={`group flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm outline-none ring-2 ring-transparent transition duration-200 hover:-translate-y-1 focus-visible:ring-mint/30 ${
                isActive
                  ? selectedClass
                  : "border-line hover:border-mint/25 hover:shadow-[0_18px_45px_rgba(17,17,17,0.1)]"
              }`}
            >
              <div className="h-56 overflow-hidden rounded-t-2xl sm:h-64 lg:h-56 xl:h-60">
                <img
                  src={image}
                  alt={imageAlt}
                  width="1024"
                  height="1024"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02]"
                />
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-semibold tracking-normal text-slate-50">{title}</h2>
                    <p className={`mt-2 text-sm font-semibold leading-6 ${accentClass}`}>{accent}</p>
                  </div>
                  <span
                    className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      isActive ? iconActiveClass : "bg-panel2 text-slate-500"
                    }`}
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{description}</p>
                <div className="mt-auto pt-6">
                  <span className={`inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold shadow-sm transition ${buttonClass}`}>
                    {action}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      <section
        id="study-assistant-panel"
        role="tabpanel"
        aria-labelledby={`${activeOption.id}-study-option`}
        className="min-w-0"
      >
        <p className="sr-only">
          {activeOption.title}
        </p>
        {activeTab === "live" && <LiveClassAssistant />}
        {activeTab === "youtube" && <YouTubeNotes />}
        {activeTab === "pdf" && <PDFNotes />}
      </section>
    </div>
  );
}
