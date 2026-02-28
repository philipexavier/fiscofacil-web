import dynamic from 'next/dynamic'

// Desativa SSR — componente roda só no browser
const AdminMeilisearch = dynamic(
  () => import('../../components/AdminMeilisearch'),
  { ssr: false }
)

export default function Page() {
  return <AdminMeilisearch />
}
