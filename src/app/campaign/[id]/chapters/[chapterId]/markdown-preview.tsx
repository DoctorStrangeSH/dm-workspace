'use client'

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Props {
  content: string
  campaignId?: string
  entityMap?: Record<string, string>
  className?: string
}

function preprocessWikilinks(text: string): string {
  return text.replace(
    /\[\[([^\]]+)\]\]/g,
    (_match, name) => `<a data-entity="${name.trim()}" class="entity-link">${name.trim()}</a>`
  )
}

export default function MarkdownPreview({ content, campaignId, entityMap, className }: Props) {
  const processed = useMemo(() => preprocessWikilinks(content), [content])

  return (
    <div className={cn('prose max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ node, children, href, ...rest }) => {
            const entityName = (node?.properties?.['data-entity'] ||
              node?.properties?.dataEntity) as string | undefined

            if (entityName) {
              const entityId = entityMap?.[entityName]

              if (entityId && campaignId) {
                return (
                  <Link
                    href={`/campaign/${campaignId}/entities/${entityId}`}
                    className="entity-link"
                    title={`Открыть: ${entityName}`}
                  >
                    {children}
                  </Link>
                )
              }

              return (
                <span className="entity-link entity-link-missing" title="Сущность не найдена">
                  {children}
                </span>
              )
            }

            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
                {children}
              </a>
            )
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  )
}
