import { Header } from "@/components/header"
import { RealShowDetail } from "@/components/real-show-detail"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ShowDetailPage({ params }: PageProps) {
  const { id } = await params
  return (
    <div>
      <Header />
      <RealShowDetail showId={id} />
    </div>
  )
}
