import { HelpCircle, Layers, Lightbulb, ListChecks, RotateCcw } from "lucide-react";
import { useState } from "react";

function SectionHeading({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-mint" />
      <h3 className="text-sm font-semibold uppercase tracking-wide text-mint">{children}</h3>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span className="rounded-full border border-mint/20 bg-mint/10 px-2.5 py-1 text-xs font-medium text-mint">
      {children}
    </span>
  );
}

function PracticeQuestion({ item, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <p className="font-medium text-slate-100">{index + 1}. {item.question}</p>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-3 text-sm font-semibold text-mint hover:text-mint/80"
      >
        {open ? "Hide answer" : "Show answer"}
      </button>
      {open && <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.answer}</p>}
    </div>
  );
}

function MCQCard({ mcq, index }) {
  const [selected, setSelected] = useState("");
  const answered = Boolean(selected);

  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <p className="font-medium text-slate-100">{index + 1}. {mcq.question}</p>
      <div className="mt-3 grid gap-2">
        {(mcq.options || []).map((option) => {
          const isCorrect = answered && option.label === mcq.answer;
          const isWrong = answered && selected === option.label && option.label !== mcq.answer;

          return (
            <button
              key={`${mcq.question}-${option.label}`}
              type="button"
              onClick={() => setSelected(option.label)}
              className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                isCorrect
                  ? "border-mint bg-mint/10 text-slate-100"
                  : isWrong
                    ? "border-rose/30 bg-rose/10 text-slate-100"
                    : "border-line bg-panel2 text-slate-300 hover:border-mint/30"
              }`}
            >
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                isCorrect ? "border-mint text-mint" : isWrong ? "border-rose text-rose" : "border-line text-slate-500"
              }`}>
                {option.label}
              </span>
              <span>{option.text}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-3 rounded-lg border border-line bg-ink p-3 text-sm text-slate-400">
          <span className="font-semibold text-slate-100">Answer: {mcq.answer}.</span>
          {mcq.explanation ? ` ${mcq.explanation}` : ""}
        </div>
      )}
    </div>
  );
}

function Flashcard({ card }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setFlipped((value) => !value)}
      className="min-h-32 rounded-lg border border-line bg-panel p-4 text-left shadow-sm transition hover:border-mint/30 hover:shadow-glow"
    >
      <div className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-wide text-slate-500">
        <span>{flipped ? "Back" : "Front"}</span>
        <RotateCcw className="h-3.5 w-3.5" />
      </div>
      <p className="text-sm font-semibold leading-relaxed text-slate-100">
        {flipped ? card.back : card.front}
      </p>
    </button>
  );
}

export default function NoteDisplay({ note }) {
  if (!note) return null;

  return (
    <article className="space-y-7">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal text-slate-50">{note.title}</h2>
        {note.overview && (
          <section className="mt-4">
            <SectionHeading icon={Lightbulb}>Overview</SectionHeading>
            <p className="mt-3 leading-relaxed text-slate-300">{note.overview}</p>
          </section>
        )}
      </div>

      {Boolean(note.prerequisites?.length) && (
        <section>
          <SectionHeading icon={Layers}>Prerequisites</SectionHeading>
          <div className="mt-3 flex flex-wrap gap-2">
            {note.prerequisites.map((item) => <Tag key={item}>{item}</Tag>)}
          </div>
        </section>
      )}

      {Boolean(note.sections?.length) && (
        <section className="space-y-3">
          <SectionHeading icon={Layers}>Sections</SectionHeading>
          {note.sections.map((section) => (
            <div key={section.heading} className="rounded-lg border border-line bg-panel p-4">
              <h4 className="font-semibold text-slate-100">{section.heading}</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{section.content}</p>
              {Boolean(section.key_terms?.length) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {section.key_terms.map((term) => <Tag key={`${section.heading}-${term}`}>{term}</Tag>)}
                </div>
              )}
              {section.example && (
                <div className="mt-3 rounded-lg border border-line bg-panel2 p-3 text-sm leading-relaxed text-slate-400">
                  <span className="font-semibold text-slate-100">Example:</span> {section.example}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {Boolean(note.key_takeaways?.length) && (
        <section>
          <SectionHeading icon={ListChecks}>Key Takeaways</SectionHeading>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
            {note.key_takeaways.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      )}

      {note.short_revision_note && (
        <section className="rounded-lg border border-amber/25 bg-amber/10 p-4">
          <SectionHeading icon={Lightbulb}>Short Revision Note</SectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{note.short_revision_note}</p>
        </section>
      )}

      {Boolean(note.common_doubts?.length) && (
        <section>
          <SectionHeading icon={HelpCircle}>Common Doubts</SectionHeading>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
            {note.common_doubts.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      )}

      {Boolean(note.practice_questions?.length) && (
        <section className="space-y-3">
          <SectionHeading icon={HelpCircle}>Practice Questions</SectionHeading>
          {note.practice_questions.map((item, index) => (
            <PracticeQuestion key={item.question} item={item} index={index} />
          ))}
        </section>
      )}

      {Boolean(note.mcqs?.length) && (
        <section className="space-y-3">
          <SectionHeading icon={ListChecks}>MCQs</SectionHeading>
          {note.mcqs.map((mcq, index) => (
            <MCQCard key={mcq.question} mcq={mcq} index={index} />
          ))}
        </section>
      )}

      {Boolean(note.flashcards?.length) && (
        <section>
          <SectionHeading icon={RotateCcw}>Flashcards</SectionHeading>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {note.flashcards.map((card) => (
              <Flashcard key={card.front} card={card} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
