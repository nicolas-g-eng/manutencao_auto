# Revisa · Controle de manutenção automotiva

App estático (HTML/CSS/JS) para GitHub Pages. Vários veículos por usuário, plano de manutenção padrão editável, histórico de gastos, visitas à oficina e alertas de vencimento. Instalável no celular (PWA) e funciona offline.

## Como funcionam os usuários
Cada usuário cria sua conta (usuário + senha). Os dados ficam **criptografados (AES-256-GCM)** no navegador do aparelho e só abrem com a senha daquele usuário. Um usuário nunca vê os veículos de outro, mesmo no mesmo aparelho. Não há servidor: para levar os dados a outro aparelho, use Mais → Baixar backup e importe na tela de login.

## Publicar
1. Envie `index.html`, `app.js`, `style.css`, `sw.js`, `manifest.webmanifest`, os ícones e a pasta `fonts/` para a raiz do repositório.
2. Settings → Pages → Deploy from a branch → `main` / root.

## Créditos
Fontes Barlow Condensed e Inter (SIL OFL) via Fontsource. Ícones Lucide (ISC).
