import json
import meilisearch
import os
import re

MEILI_URL  = os.getenv("MEILISEARCH_URL", "http://fiscofacil_meilisearch:7700")
MEILI_KEY  = os.getenv("MEILI_MASTER_KEY", "E8H-DDQU9GhZhFWhTq263Ohd80UErhFmLIFnlQK81oeQ")
INDEX_NAME = "ncm"
ARQUIVO    = os.getenv("NCM_FILE", "./data/Tabela_NCM_Vigente_20260227.json")

client = meilisearch.Client(MEILI_URL, MEILI_KEY)

# ── Detecta se é NCM válido (10 dígitos: 0000.00.00) ─────────
def is_ncm_valido(codigo: str) -> bool:
    return bool(re.match(r"^\d{4}\.\d{2}\.\d{2}$", codigo))

# ── Detecta nível hierárquico para contexto ──────────────────
def detectar_nivel(codigo: str) -> str:
    if re.match(r"^\d{2}$", codigo):          return "capitulo"
    if re.match(r"^\d{2}\.\d{2}$", codigo):  return "posicao"
    if re.match(r"^\d{4}\.\d$", codigo):      return "subposicao_1"
    if re.match(r"^\d{4}\.\d{2}$", codigo):  return "subposicao_2"
    if re.match(r"^\d{4}\.\d{2}\.\d{2}$", codigo): return "ncm"
    return "outro"

# ── Limpa HTML da descrição ───────────────────────────────────
def limpar_descricao(texto: str) -> str:
    texto = re.sub(r"<[^>]+>", "", texto)   # remove tags HTML
    return texto.strip(" -–")

# ── Configura índice Meilisearch ──────────────────────────────
def configurar_indice():
    try:
        client.create_index(INDEX_NAME, {"primaryKey": "id"})
        print("✅ Índice 'ncm' criado.")
    except Exception:
        print("ℹ️  Índice 'ncm' já existe.")

    index = client.index(INDEX_NAME)

    index.update_searchable_attributes([
        "descricao",        # busca principal por texto
        "codigo",           # busca por número NCM
        "descricao_limpa",  # sem hífens e tags HTML
    ])

    index.update_filterable_attributes([
        "nivel",            # filtrar só NCMs válidos
        "capitulo",         # filtrar por capítulo (ex: "01")
        "ativo",            # filtrar só NCMs vigentes
    ])

    index.update_ranking_rules([
        "words",
        "typo",             # tolera erro de digitação
        "proximity",
        "attribute",
        "sort",
        "exactness"
    ])

    print("✅ Índice configurado.")
    return index

# ── Processa e indexa ─────────────────────────────────────────
def indexar(index):
    print(f"\n📂 Lendo: {ARQUIVO}")
    with open(ARQUIVO, "r", encoding="utf-8") as f:
        dados = json.load(f)

    meta        = dados.get("Data_Ultima_Atualizacao_NCM", "")
    ato         = dados.get("Ato", "")
    nomenclaturas = dados.get("Nomenclaturas", [])
    print(f"📋 Fonte: {meta} | {ato}")
    print(f"📦 Total de entradas no JSON: {len(nomenclaturas)}")

    documentos   = []
    total_ncm    = 0
    capitulo_atual = "00"

    for i, item in enumerate(nomenclaturas):
        codigo = item.get("Codigo", "").strip()
        desc   = item.get("Descricao", "").strip()
        nivel  = detectar_nivel(codigo)

        # Rastreia o capítulo atual para contexto
        if nivel == "capitulo":
            capitulo_atual = codigo

        # Verifica se ainda está vigente
        data_fim = item.get("Data_Fim", "31/12/9999")
        ativo = (data_fim == "31/12/9999")

        doc = {
            "id":               i,
            "codigo":           codigo,
            "descricao":        desc,
            "descricao_limpa":  limpar_descricao(desc),
            "nivel":            nivel,
            "capitulo":         capitulo_atual,
            "ativo":            ativo,
            "data_inicio":      item.get("Data_Inicio", ""),
            "data_fim":         data_fim,
            "ato":              f"{item.get('Tipo_Ato_Ini','')} {item.get('Numero_Ato_Ini','')}/{item.get('Ano_Ato_Ini','')}",
        }
        documentos.append(doc)

        if nivel == "ncm":
            total_ncm += 1

    # Indexa em lotes de 1000
    LOTE = 1000
    for i in range(0, len(documentos), LOTE):
        lote = documentos[i:i + LOTE]
        task = index.add_documents(lote)
        print(f"  ✅ Lote {i//LOTE + 1}: {len(lote)} entradas (task: {task.task_uid})")

    print(f"\n🎉 Concluído!")
    print(f"   Total indexado : {len(documentos)} entradas")
    print(f"   NCMs válidos   : {total_ncm}")

# ── Main ──────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🚀 FiscoFácil – Ingestão da Tabela NCM Vigente 2026")
    print("=" * 52)
    index = configurar_indice()
    indexar(index)
    print(f"\n🔍 Acesse: {MEILI_URL}")
