import { Header } from "@/components/header"
import { RealShowDetail } from "@/components/real-show-detail"
import { client } from '@/lib/sanity/client'
import { SHOW_OVERRIDE_BY_KEY_QUERY } from '@/lib/sanity/queries/showOverrides'
import { PortableTextRenderer } from '@/components/portable-text-renderer'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ShowDetailPage({ params }: PageProps) {
  const { id } = await params
  const mixcloudKey = decodeURIComponent(id)

  // Fetch editorial override in parallel — use base client (build-time safe)
  const override = await client.fetch(SHOW_OVERRIDE_BY_KEY_QUERY, { mixcloudKey }).catch(() => null)

  return (
    <div>
      <Header />
      <RealShowDetail showId={id} />
      {override && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
          {override.customDescription && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">About This Show</h3>
              <PortableTextRenderer value={override.customDescription} />
            </div>
          )}
          {override.tags && override.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {override.tags.map((tag: { label: string; slug: string }) => (
                <span key={tag.slug} className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">
                  {tag.label}
                </span>
              ))}
            </div>
          )}
          {override.relatedContent && override.relatedContent.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Related</h3>
              <ul className="space-y-2">
                {override.relatedContent.map((item: { _type: string; title: string; slug: string }) => {
                  const href = item._type === 'post' ? `/blog/${item.slug}`
                    : item._type === 'deepDive' ? `/deep-dives/${item.slug}`
                    : `/profiles/${item.slug}`
                  return (
                    <li key={item.slug}>
                      <a href={href} className="text-purple-400 hover:text-purple-300 underline">
                        {item.title}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
