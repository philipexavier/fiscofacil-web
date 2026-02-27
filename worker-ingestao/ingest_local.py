import json, meilisearch, re

# ── ALTERE AQUI ───────────────────────────────────────────────
MEILI_URL = "http://fiscofacil_meilisearch:7700"  # ← seu domínio EasyPanel
MEILI_KEY = "E8H-DDQU9GhZhFWhTq263Ohd80UErhFmLIFnlQK81oeQ"           # ← MEILI_MASTER_KEY do .env
ARQUIVO   = "Tabela_NCM_Vigente_20260227.json"  # ← mesmo diretório
# ─────────────────────────────────────────────────────────────

client = meilisearch.Client(MEILI_URL, MEILI_KEY)

def detectar_nivel(codigo):
    if re.match(r"^\d{2}$", codigo):               return "capitulo"
    if re.match(r"^\d{2}\.\d{2}$", codigo):        return "posicao"
    if re.match(r"^\d{4}\.\d{2}\.\d{2}$", codigo): return "ncm"
    return "subposicao"

def limpar(texto):
    return re.sub(r"<[^>]+>", "", texto).strip(" -–")

# Configura índice
try:
    client.create_index("ncm", {"primaryKey": "id"})
    print("✅ Índice criado")
except:
    print("ℹ️  Índice já existe")

index = client.index("ncm")
index.update_searchable_attributes(["descricao", "codigo", "descricao_limpa"])
index.update_filterable_attributes(["nivel", "ativo"])
print("✅ Índice configurado")

# Lê JSON
print(f"📂 Lendo {ARQUIVO}...")
with open(ARQUIVO, "r", encoding="utf-8") as f:
    dados = json.load(f)

nomenclaturas = dados["Nomenclaturas"]
print(f"📦 {len(nomenclaturas)} entradas encontradas")

# Prepara documentos
docs = []
capitulo_atual = "00"
for i, item in enumerate(nomenclaturas):
    codigo = item.get("Codigo", "").strip()
    nivel  = detectar_nivel(codigo)
    if nivel == "capitulo":
        capitulo_atual = codigo
    docs.append({
        "id":              i,
        "codigo":          codigo,
        "descricao":       item.get("Descricao", ""),
        "descricao_limpa": limpar(item.get("Descricao", "")),
        "nivel":           nivel,
        "capitulo":        capitulo_atual,
        "ativo":           item.get("Data_Fim") == "31/12/9999",
    })

# Envia em lotes
print("\n🚀 Enviando para Meilisearch...")
for i in range(0, len(docs), 1000):
    lote = docs[i:i+1000]
    task = index.add_documents(lote)
    print(f"  ✅ Lote {i//1000+1}: {len(lote)} docs enviados")

print(f"\n🎉 Concluído! {len(docs)} entradas no índice 'ncm'.")
