import dynamic from 'next/dynamic'

const AdminMeilisearch = dynamic(
  () => import('../../components/AdminMeilisearch'),
  { ssr: false, loading: () => <p style={{color:'white',padding:'2rem'}}>Carregando...</p> }
)

export default function Page() {
  return <AdminMeilisearch />
}
