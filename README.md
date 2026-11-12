# Focus 2013 · Controle de Manutenção

App estático (HTML/CSS/JS) para publicar no GitHub Pages.

## Recursos
Instalável como app (PWA, ícone de carro), funciona offline, alertas de vencimento, filtros e busca.

## Publicar
1. Crie um repositório no GitHub (pode ser privado se seu plano permitir Pages; senão público — os dados NÃO ficam no repositório).
2. Envie `index.html`, `app.js`, `style.css` e este README.
3. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)` → Save.
4. Abra `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## Primeiro acesso
Escolha usuário e senha e anexe o arquivo `dados-iniciais.json` (fica só com você, não suba no GitHub). Os dados são criptografados (AES-256-GCM, chave via PBKDF2 do usuário+senha) e ficam no navegador do aparelho.

## Outro aparelho
Conta → "Baixar backup criptografado" → no outro aparelho, tela de login → "Backup / outro aparelho" → importar → entre com o mesmo usuário e senha.

## Limites
Sem servidor, não há sincronização automática e quem esquecer a senha perde os dados (guarde um backup). Limpar os dados do navegador apaga o cofre local.
