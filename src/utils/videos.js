export function getLessonVideos(module) {
  const metadataVideos = module?.module_metadata?.lesson_videos || [];
  const rawVideos = module?.videos || module?.lesson_videos || metadataVideos;
  if (!Array.isArray(rawVideos)) return [];

  return rawVideos.filter((video) => {
    return video && typeof video.embed_url === "string" && video.embed_url.trim();
  });
}
