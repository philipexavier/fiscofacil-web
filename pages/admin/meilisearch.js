import dynamic from 'next/dynamic'

const AdminMeilisearch = dynamic(
  () => import('../../components/AdminMeilisearch'),
  { ssr: false }
)

export default function Page() {
  return <AdminMeilisearch />
}
