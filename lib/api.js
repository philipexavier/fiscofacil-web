import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
})

export const buscarProdutos = (query) =>
  api.get(`/catalogo/buscar?q=${query}`)

export const guiaTributario = (dados) =>
  api.post('/guia-tributario', dados)

export const classificarNcm = (produto) =>
  api.post('/classificar-ncm', produto)

export default api
