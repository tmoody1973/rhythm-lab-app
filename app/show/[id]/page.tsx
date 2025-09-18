import { Header } from "@/components/header"
import { RealShowDetail } from "@/components/real-show-detail"

interface PageProps {
  params: {
    id: string
  }
}

export default function ShowDetailPage({ params }: PageProps) {
  return (
    <div>
      <Header />
      <RealShowDetail showId={params.id} />
    </div>
  )
}
