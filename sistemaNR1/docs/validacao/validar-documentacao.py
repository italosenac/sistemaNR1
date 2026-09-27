"""Verifica a entrega documental; nao executa testes do aplicativo."""

from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import sys
from urllib.parse import unquote


def documentos_do_projeto(raiz):
    ignorados = {"node_modules", ".git", ".next", ".next-e2e", "dist", "coverage", "test-results", "playwright-report", ".temp", ".codex", "__pycache__"}
    documentos = []
    for pasta, diretorios, arquivos in os.walk(raiz, followlinks=False):
        diretorios[:] = [nome for nome in diretorios if nome not in ignorados and not nome.startswith(".e0-diagnostico-")]
        documentos.extend(Path(pasta) / nome for nome in arquivos if nome.endswith(".md"))
    return sorted(documentos)


def validar(raiz, fase_documental_inicial=False):
    erros = []
    esperados = {f"RF-{modulo:02d}.{numero}" for modulo, total in [(1, 7), (2, 8), (3, 6)] for numero in range(1, total + 1)}
    secoes = ["Origem documental", "Objetivo", "Atores", "Entradas", "Processamento", "Saídas", "Regras de negócio", "Regras de bloqueio", "Dependências", "Critérios de aceitação", "Testes necessários", "Estado de implementação", "Observações"]
    specs = sorted((raiz / "specs").glob("*/rf-*.spec.md"))
    encontrados = []
    cenarios = []
    for arquivo in specs:
        texto = arquivo.read_text(encoding="utf-8")
        identificador = re.match(r"# (RF-\d{2}\.\d+) — ", texto)
        if not identificador:
            erros.append(f"Identificacao invalida: {arquivo.relative_to(raiz)}")
            continue
        identificador = identificador.group(1)
        encontrados.append(identificador)
        blocos = dict(re.findall(r"^## ([^\n]+)\n(.*?)(?=^## |\Z)", texto, re.M | re.S))
        for secao in secoes:
            if len(blocos.get(secao, "").strip()) < 15:
                erros.append(f"{identificador}: secao ausente/vazia: {secao}")
        estados = ["Pendente", "Em desenvolvimento", "Parcialmente implementado", "Concluído e testado"]
        if not any(estado in blocos.get("Estado de implementação", "") for estado in estados):
            erros.append(f"{identificador}: estado de implementacao ausente/invalido")
        casos = re.findall(r"\*\*(CA-\d{2}-\d+-\d{2})\*\*", blocos.get("Critérios de aceitação", ""))
        if len(casos) < 2:
            erros.append(f"{identificador}: faltam cenarios proprios")
        cenarios.extend(casos)
    if set(encontrados) != esperados or len(encontrados) != 21:
        erros.append("Conjunto de RFs diferente dos 21 esperados")
    if len(cenarios) != len(set(cenarios)):
        erros.append("Identificadores de cenarios duplicados")

    obrigatorios = ["AGENTS.md", "README.md", "specs/produto.spec.md", "specs/camada-0/estrutura-organizacional.spec.md", "docs/backlog-mvp.md", "docs/matriz-rastreabilidade.md", "docs/pendencias.md", "docs/desenvolvimento-sdd.md", "docs/conformidade/verificacao-nr1.md"]
    obrigatorios += [f"docs/arquitetura/{nome}.md" for nome in ["visao-geral", "modelo-dominio", "contratos-modulos", "decisoes", "padroes-codigo", "integracoes-mcp", "seguranca-privacidade"]]
    if not fase_documental_inicial:
        obrigatorios += ["specs/camada-0/usuarios-perfis.spec.md"]
        obrigatorios += [f"docs/arquitetura/{nome}.md" for nome in ["modelo-identidade", "matriz-permissoes", "compatibilidade-schemas", "isolamento-multiempresa"]]
    for nome in obrigatorios:
        if not (raiz / nome).is_file():
            erros.append(f"Documento obrigatorio ausente: {nome}")
    for nome in ["docs/matriz-rastreabilidade.md", "docs/backlog-mvp.md"]:
        arquivo = raiz / nome
        if arquivo.exists():
            texto = arquivo.read_text(encoding="utf-8")
            for identificador in esperados:
                linhas = [linha for linha in texto.splitlines() if re.match(r"\| \[?" + re.escape(identificador) + r"(?:\]| \|)", linha)]
                if len(linhas) != 1:
                    erros.append(f"{nome}: {identificador} precisa de uma linha propria")

    manifesto = json.loads((raiz / "docs/extracao/manifesto.json").read_text(encoding="utf-8"))
    paginas = 0
    for fonte in manifesto:
        arquivo = raiz / Path(fonte["arquivo"].replace("\\", "/"))
        if hashlib.sha256(arquivo.read_bytes()).hexdigest() != fonte["sha256"]:
            erros.append(f"Fonte alterada: {arquivo.name}")
        paginas += fonte["paginas"]
        extracao = raiz / "docs/extracao" / (arquivo.stem.lower() + ".md")
        texto = extracao.read_text(encoding="utf-8")
        if len(re.findall(r"^## Página \d+$", texto, re.M)) != fonte["paginas"]:
            erros.append(f"Paginas ausentes na extracao de {arquivo.name}")
        for numero in range(1, fonte["paginas"] + 1):
            if not (raiz / f"docs/extracao/previas/{arquivo.stem}-{numero}.png").exists():
                erros.append(f"Previa ausente de {arquivo.name}: {numero}")

    nomes_skills = ["implementar-requisito", "validar-regra-negocio", "revisar-codigo-limpo"]
    for nome in nomes_skills:
        arquivo = raiz / f".agents/skills/{nome}/SKILL.md"
        if not arquivo.exists():
            erros.append(f"Skill ausente: {nome}")
            continue
        texto = arquivo.read_text(encoding="utf-8")
        cabecalho = re.match(r"---\n(.*?)\n---\n", texto, re.S)
        if not cabecalho or f"name: {nome}" not in cabecalho.group(1) or not re.search(r"^description: .+", cabecalho.group(1), re.M):
            erros.append(f"Frontmatter incompleto: {nome}")

    cenarios_c0 = []
    if not fase_documental_inicial:
        for arquivo in sorted((raiz / "specs/camada-0").glob("*.spec.md")):
            texto = arquivo.read_text(encoding="utf-8")
            blocos = dict(re.findall(r"^## ([^\n]+)\n(.*?)(?=^## |\Z)", texto, re.M | re.S))
            for secao in secoes:
                if len(blocos.get(secao, "").strip()) < 15:
                    erros.append(f"{arquivo.name}: secao ausente/vazia: {secao}")
            cenarios_c0.extend(re.findall(r"\*\*(CA-(?:C0|USU)-\d{2})", blocos.get("Critérios de aceitação", "")))
        if len(cenarios_c0) != len(set(cenarios_c0)):
            erros.append("Identificadores de cenarios C0 duplicados")
        for nome in ["specs/camada-0/usuarios-perfis.spec.md", "docs/arquitetura/modelo-identidade.md", "docs/arquitetura/matriz-permissoes.md"]:
            arquivo = raiz / nome
            if arquivo.is_file():
                texto = arquivo.read_text(encoding="utf-8")
                for papel in ["trabalhador", "gestor_sst_rh", "responsavel_tecnico", "consultoria"]:
                    if papel not in texto:
                        erros.append(f"{nome}: papel alvo ausente: {papel}")
        arquivo_manifesto = raiz / "docs/extracao/manifesto-arquitetura.json"
        if not arquivo_manifesto.is_file():
            erros.append("Manifesto do PDF complementar ausente")
        else:
            complemento = json.loads(arquivo_manifesto.read_text(encoding="utf-8"))
            fonte = raiz / complemento["arquivo"]
            if not fonte.is_file() or hashlib.sha256(fonte.read_bytes()).hexdigest() != complemento["sha256"]:
                erros.append("Fonte complementar ausente/alterada")
            extracao = raiz / complemento["extracao"]
            if not extracao.is_file() or len(re.findall(r"^## Página \d+$", extracao.read_text(encoding="utf-8"), re.M)) != complemento["paginas"]:
                erros.append("Extracao complementar incompleta")

    links = 0
    documentos = documentos_do_projeto(raiz)
    for arquivo in documentos:
        texto = arquivo.read_text(encoding="utf-8")
        if "\ufffd" in texto or "Extra??o" in texto or "P?gina" in texto:
            erros.append(f"Falha de codificacao: {arquivo.relative_to(raiz)}")
        for destino in re.findall(r"\[[^\]\n]+\]\(([^)\n]+)\)", texto):
            if re.match(r"[a-zA-Z][a-zA-Z0-9+.-]*:", destino) or destino.startswith("#"):
                continue
            destino = unquote(destino.strip("<>").split("#", 1)[0])
            links += 1
            alvo = (arquivo.parent / destino).resolve()
            if not alvo.exists():
                erros.append(f"Link local quebrado: {arquivo.relative_to(raiz)} -> {destino}")

    implementacao = [nome for nome in ["apps", "supabase/migrations", "package.json", "pnpm-workspace.yaml"] if (raiz / nome).exists()]
    if fase_documental_inicial and implementacao:
        erros.append("Estrutura executavel encontrada; verificar escopo: " + ", ".join(implementacao))
    return {"resultado": "APROVADO" if not erros else "FALHOU", "fase": "documental_inicial" if fase_documental_inicial else "projeto_atual", "specs_individuais": len(specs), "secoes_obrigatorias_por_spec": len(secoes), "cenarios_rf_planejados": len(cenarios), "cenarios_c0_planejados": len(cenarios_c0), "documentos_markdown": len(documentos), "paginas_pdf": paginas, "pdfs_com_hash_preservado": len(manifesto) if not any("Fonte alterada" in erro for erro in erros) else None, "skills_com_estrutura_minima": len(nomes_skills), "links_locais_verificados": links, "estrutura_executavel_presente": implementacao, "testes_funcionais_executados": 0, "erros": erros}


if __name__ == "__main__":
    raiz = Path(__file__).resolve().parents[2]
    argumentos = argparse.ArgumentParser(description=__doc__)
    argumentos.add_argument("--fase-documental-inicial", action="store_true", help="Reproduz a restricao historica da Missao 01, sem aplicativo.")
    resultado = validar(raiz, argumentos.parse_args().fase_documental_inicial)
    print(json.dumps(resultado, ensure_ascii=False, indent=2))
    sys.exit(0 if resultado["resultado"] == "APROVADO" else 1)
