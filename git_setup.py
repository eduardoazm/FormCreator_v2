import subprocess
import sys
from pathlib import Path

def setup_git_repo():
    print("=== Configuração e Publicação no GitHub ===")
    project_dir = Path(__file__).parent.resolve()
    print(f"Diretório do projeto: {project_dir}")
    
    # 1. Check if git is installed
    try:
        subprocess.run(["git", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    except Exception:
        print("Erro: Git não está instalado ou não foi encontrado no PATH do Windows.")
        print("Por favor, instale o Git antes de executar este script: https://git-scm.com/")
        sys.exit(1)
        
    # 2. Check if repo is already initialized
    git_dir = project_dir / ".git"
    if not git_dir.exists():
        print("Inicializando repositório Git local...")
        subprocess.run(["git", "init"], cwd=project_dir, check=True)
    else:
        print("Repositório Git já inicializado.")
        
    # 3. Add files to staging area
    print("Adicionando arquivos ao Git (stage)...")
    subprocess.run(["git", "add", "."], cwd=project_dir, check=True)
    
    # 4. Commit changes
    print("Criando o commit inicial...")
    try:
        # Check if user email/name is configured
        config_check = subprocess.run(["git", "config", "user.email"], capture_output=True, text=True, cwd=project_dir)
        if not config_check.stdout.strip():
            print("\n[Aviso] Configurando usuário Git temporário para o commit...")
            subprocess.run(["git", "config", "user.name", "Tecnico BFF GLPI"], cwd=project_dir)
            subprocess.run(["git", "config", "user.email", "tecnico@bff-glpi.local"], cwd=project_dir)
            
        subprocess.run(["git", "commit", "-m", "feat: implementacao inicial do BFF FastAPI para integracao REST GLPI"], cwd=project_dir, check=True)
        print("Commit criado com sucesso!")
    except subprocess.CalledProcessError:
        print("Nenhuma alteração pendente de commit ou erro ao commitar.")
        
    print("\n=== PRÓXIMOS PASSOS PARA PUBLICAR NO GITHUB ===")
    print("1. Crie um repositório vazio no seu GitHub (ex: 'glpi-api-bff')")
    print("2. Rode os seguintes comandos no seu terminal para enviar o código:")
    print("   git branch -M main")
    print("   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git")
    print("   git push -u origin main")

if __name__ == "__main__":
    setup_git_repo()
