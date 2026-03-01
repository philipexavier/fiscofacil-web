// Exemplo de hook para buscar usuário atual (client-side)
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useContadorAtual } from '@/lib/useContadorAtual'

const usuario = useContadorAtual()
{usuario && <span>Olá, {usuario.email}</span>}


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export function useContadorAtual() {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUsuario(data.user)
    })
  }, [])

  return usuario
}   