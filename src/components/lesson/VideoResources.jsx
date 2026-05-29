import { Youtube } from "lucide-react";

export default function VideoResources({ videos = [] }) {
  if (!videos.length) return null;

  return (
    <section className="mt-10 space-y-4" aria-label="Video resources">
      <div className="flex items-center gap-2">
        <Youtube className="h-5 w-5 text-rose" />
        <h2 className="text-xl font-semibold text-slate-50">Video explanation</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {videos.map((video) => (
          <article key={video.embed_url} className="space-y-2">
            <div className="aspect-video overflow-hidden rounded-lg border border-line bg-black">
              <iframe
                className="h-full w-full"
                src={video.embed_url}
                title={video.title || "YouTube lesson"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-100">{video.title}</h3>
              {video.reason && <p className="mt-1 text-sm text-slate-400">{video.reason}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
