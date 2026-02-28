import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
})

// Busca NCM via Next.js API (sem precisar de FastAPI)
export const buscarProdutos = (query) =>
  axios.get(`/api/buscar?q=${encodeURIComponent(query)}&nivel=ncm`)

export const classificarNcm = (dados) =>
  api.post('/catalogo/classificar', dados)

export default api

