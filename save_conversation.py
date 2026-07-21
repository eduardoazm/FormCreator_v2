import os
import json
from pathlib import Path

def generate_markdown_backup():
    print("=== Gerador de Backup da Conversa ===")
    
    # Paths based on conversation ID
    conversation_id = "95fe0983-ff7a-4cde-b99a-af44f55ea4a1"
    app_data_dir = Path("C:/Users/cc.gerencia02/.gemini/antigravity-cli")
    log_path = app_data_dir / "brain" / conversation_id / ".system_generated" / "logs" / "transcript.jsonl"
    
    output_dir = Path("C:/Users/cc.gerencia02/Documents/glpi-api/docs")
    output_file = output_dir / "historico_conversa.md"
    
    if not log_path.exists():
        print(f"Erro: Arquivo de logs não encontrado em {log_path.resolve()}")
        return

    print(f"Lendo logs de {log_path.resolve()}...")
    
    # Create docs folder if missing
    output_dir.mkdir(parents=True, exist_ok=True)
    
    md_content = []
    md_content.append("# 📝 Histórico da Conversa - Integração GLPI REST API\n")
    md_content.append(f"*Conversa ID: `{conversation_id}`*\n")
    md_content.append("Este arquivo contém o histórico completo das interações, dúvidas, correções e resoluções ocorridas durante o pareamento de desenvolvimento.\n")
    md_content.append("---\n")
    
    step_num = 1
    with open(log_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                step = json.loads(line)
                step_type = step.get("type")
                source = step.get("source")
                
                # Check for User Input
                if step_type == "USER_INPUT" and source == "USER_EXPLICIT":
                    content = step.get("content", "")
                    md_content.append(f"\n### 👤 Técnico (Mensagem #{step_num})\n")
                    md_content.append(f"{content}\n")
                    md_content.append("---\n")
                    step_num += 1
                
                # Check for Planner Response (Model output)
                elif step_type == "PLANNER_RESPONSE" and source == "MODEL":
                    content = step.get("content", "")
                    # Strip tool calls JSON if present at the end or format cleanly
                    if content:
                        md_content.append(f"\n### 🤖 Antigravity Coding Assistant\n")
                        md_content.append(f"{content}\n")
                        md_content.append("---\n")
                        
            except Exception as e:
                continue
                
    try:
        with open(output_file, 'w', encoding='utf-8') as out_f:
            out_f.write("\n".join(md_content))
        print(f"Backup gerado com sucesso em: {output_file.resolve()}")
    except Exception as e:
        print(f"Erro ao gravar o backup: {str(e)}")

if __name__ == "__main__":
    generate_markdown_backup()
