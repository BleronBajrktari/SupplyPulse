import { useParams } from 'react-router-dom'

interface PlaceholderPageProps {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  const params = useParams()
  const param = Object.values(params)[0]

  return (
    <div className="p-6">
      <h1 className="font-mono text-lg font-semibold text-zinc-100">{title}</h1>
      <p className="mt-1 text-sm text-zinc-500">This view hasn't been built yet{param ? ` (${param})` : ''}.</p>
    </div>
  )
}
