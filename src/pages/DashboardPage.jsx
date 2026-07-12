import { ArrowRight, BookOpen, CheckCircle2, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import courseLearningGif from "../assets/dashboard-course-learning.gif";
import studyAssistantGif from "../assets/dashboard-study-assistant.gif";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import CourseCard from "../components/course/CourseCard";
import { useCourses } from "../hooks/useCourses";

const workflowCards = [
  {
    to: "/courses",
    title: "AI Course Builder",
    description: "Create a personalized course built around your goal",
    detail: "Generate customizable AI-powered courses with roadmaps, modules, lessons, evaluations, and progress tracking designed for the way you learn.",
    action: "Build My Course",
    image: courseLearningGif,
    imageAlt: "Student using laptop for structured course learning",
    cardClass: "border-mint/20 hover:border-mint/45 hover:shadow-glow focus-visible:ring-mint/35",
    imageClass: "border-mint/15 bg-[#f7f1ff]",
    accentClass: "text-mint",
    buttonClass: "bg-mint text-white group-hover:bg-[#6d28d9]"
  },
  {
    to: "/study-assistant",
    title: "AI Study Assistant",
    description: "Turn PDFs, YouTube videos, and Google Meet sessions into learnable notes",
    detail: "Convert your study materials and live sessions into structured notes, summaries, key points, and revision-friendly learning content.",
    action: "Create Study Notes",
    image: studyAssistantGif,
    imageAlt: "Student creating study notes from learning materials",
    cardClass: "border-[#f97316]/20 hover:border-[#f97316]/40 hover:shadow-[0_24px_70px_rgba(249,115,22,0.16)] focus-visible:ring-[#f97316]/35",
    imageClass: "border-[#f97316]/20 bg-[#fff4eb]",
    accentClass: "text-[#f97316]",
    buttonClass: "bg-[#f97316] text-white group-hover:bg-[#ea580c]"
  },
  {
    to: "/institution",
    title: "My Institution",
    description: "AI-powered classrooms for schools, coaching centers, and tutors",
    detail: "Create classrooms, assign adaptive AI courses to every student, generate tests, and get analytics, insights, and a teaching assistant that knows your class.",
    action: "Open My Institution",
    image: "/images/slideshow-mentor-evaluation.png",
    imageAlt: "Teacher managing an AI-powered classroom",
    cardClass: "border-[#0ea5e9]/20 hover:border-[#0ea5e9]/40 hover:shadow-[0_24px_70px_rgba(14,165,233,0.16)] focus-visible:ring-[#0ea5e9]/35",
    imageClass: "border-[#0ea5e9]/20 bg-[#eef8ff]",
    accentClass: "text-[#0284c7]",
    buttonClass: "bg-[#0ea5e9] text-white group-hover:bg-[#0284c7]"
  }
];

export default function DashboardPage() {
  const { courses, loading, error } = useCourses();
  const completed = courses.reduce((sum, course) => sum + Number(course.completed_modules || 0), 0);
  const totalModules = courses.reduce((sum, course) => sum + Number(course.module_count || 0), 0);
  const activeModules = Math.max(totalModules - completed, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-9">
      <section className="px-0 pb-10 pt-8 sm:pb-12 sm:pt-10 lg:pb-16 lg:pt-12">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="dashboard-hero-title-wrap max-w-5xl">
            <h1
              className="text-[3.5rem] font-black tracking-normal text-slate-100 sm:text-[4.5rem] lg:text-[5.85rem]"
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
            <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-4xl lg:text-[2.75rem]">
              <span className="block">Build Your Own AI Course,</span>
              <span className="block text-mint">Matched to Your Learning Style</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 lg:pb-3">
            <Link to="/courses">
              <Button variant="secondary">
                <BookOpen className="h-4 w-4" />
                View Courses
              </Button>
            </Link>
            <Link to="/courses/new">
              <Button>
                <PlusCircle className="h-4 w-4" />
                Create New Course
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {workflowCards.map(({
          to,
          title,
          description,
          detail,
          action,
          image,
          imageAlt,
          cardClass,
          imageClass,
          accentClass,
          buttonClass
        }) => (
          <Link
            key={to}
            to={to}
            className={`group flex min-h-full flex-col overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${cardClass}`}
          >
            <div className={`aspect-video overflow-hidden rounded-xl border ${imageClass}`}>
              <img
                src={image}
                alt={imageAlt}
                width="960"
                height="540"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            </div>
            <div className="flex flex-1 flex-col px-1 pb-1 pt-6">
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold tracking-normal text-slate-50 sm:text-3xl">{title}</h2>
                <p className={`mt-2 text-sm font-semibold leading-6 ${accentClass}`}>{description}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{detail}</p>
              </div>
              <div className="mt-auto pt-6">
                <span className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold shadow-sm transition ${buttonClass}`}>
                  {action}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <BookOpen className="h-5 w-5 text-mint" />
          <div className="mt-4 text-2xl font-semibold">{courses.length}</div>
          <div className="text-sm text-slate-400">Courses created</div>
        </Card>
        <Card className="p-5">
          <CheckCircle2 className="h-5 w-5 text-mint" />
          <div className="mt-4 text-2xl font-semibold">{completed}</div>
          <div className="text-sm text-slate-400">Modules completed</div>
        </Card>
        <Card className="p-5">
          <ArrowRight className="h-5 w-5 text-amber" />
          <div className="mt-4 text-2xl font-semibold">{activeModules}</div>
          <div className="text-sm text-slate-400">Modules left in active paths</div>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-mint">Recent courses</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-50">Pick up where you left off</h2>
          </div>
          <Link to="/courses" className="text-sm font-semibold text-mint hover:text-[#6d28d9]">View all</Link>
        </div>
        {loading && <LoadingSpinner label="Loading courses" />}
        {error && <p className="text-sm text-rose">{error}</p>}
        {!loading && courses.length === 0 && (
          <EmptyState
            title="No courses yet"
            description="Create your first adaptive course with the guided setup flow."
            action={<Link to="/courses/new"><Button>Create New Course</Button></Link>}
          />
        )}
        <div className="grid gap-4 lg:grid-cols-3">
          {!loading && courses.slice(0, 3).map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </div>
  );
}
