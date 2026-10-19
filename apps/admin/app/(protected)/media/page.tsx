import { getAllMediaList } from "@/features/media/queries"
import { MediaClient } from "./_components/media-client"

export default async function MediaPage() {
  const media = await getAllMediaList()

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <MediaClient media={media} />
    </div>
  )
}
