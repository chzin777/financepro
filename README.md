<div align="center">

# 💰 FinancePro

**Dashboard Financeiro Pessoal**

Um dashboard moderno e responsivo para controle financeiro pessoal, com tema dark, gráficos interativos e banco de dados na nuvem.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=for-the-badge)](https://orm.drizzle.team/)
[![Neon](https://img.shields.io/badge/Neon-Postgres-00E599?style=for-the-badge)](https://neon.tech/)

</div>

---

## 📋 Sobre

FinancePro é um dashboard financeiro pessoal desenvolvido para gerenciar finanças do dia a dia com praticidade. Otimizado para uso mobile, permite registrar gastos, controlar contas fixas e temporárias, e visualizar previsões financeiras — tudo com dados persistidos na nuvem.

### Lógica de Salário

O sistema foi configurado para um salário mensal de **R$ 6.000** dividido em dois pagamentos:

| Pagamento | Dia | Regra de fim de semana |
|-----------|-----|------------------------|
| 1ª parcela | Dia **01** de cada mês | Se cai em sáb/dom → paga na **sexta anterior** |
| 2ª parcela | Dia **15** de cada mês | Se cai em sáb/dom → paga na **sexta anterior** |

---

## ✨ Funcionalidades

### 🏠 Dashboard
- Saldo atual com destaque visual (editável)
- Cards de receitas e gastos do mês
- Próximos salários com ajuste automático de fins de semana
- Gráfico de barras dos últimos 6 meses
- Gráfico de pizza por categoria de gasto
- Transações recentes com acesso rápido

### 💸 Transações
- Adicionar gastos e receitas
- 11 categorias com ícones: Alimentação 🍔, Transporte 🚗, Moradia 🏠, Saúde 💊, Educação 📚, Lazer 🎮, Compras 🛒, Investimento 📈, Financiamento 🏦, Assinatura 📱, Outros 📋
- Listagem completa com opção de excluir
- Filtro por data e tipo

### 📅 Contas
- **Contas fixas** (Netflix, aluguel, internet...)
- **Contas temporárias** com parcelas (financiamento do carro - 40x, etc.)
- Dia de vencimento configurável
- Controle de parcela atual / total

### 📊 Previsão Financeira
- Projeção de saldo para os próximos 6 meses
- Gráfico de área com saldo projetado
- Detalhamento mensal (receita, gastos, líquido)
- Calendário dos próximos salários

### 🧹 Limpeza Automática
- Cron job diário (via Vercel Cron) às 3h da manhã
- Remove transações com mais de **3 meses**
- Desativa contas temporárias expiradas
- Remove contas inativas antigas
- Mantém o banco dentro do free tier (512MB)

---

## 🛠️ Tech Stack

| Tecnologia | Função |
|---|---|
| [Next.js 16](https://nextjs.org/) | Framework React com App Router e API Routes |
| [TypeScript 5](https://www.typescriptlang.org/) | Tipagem estática |
| [Tailwind CSS 4](https://tailwindcss.com/) | Estilização utility-first |
| [Drizzle ORM](https://orm.drizzle.team/) | ORM type-safe para PostgreSQL |
| [Neon](https://neon.tech/) | PostgreSQL serverless na nuvem |
| [Recharts](https://recharts.org/) | Gráficos interativos |
| [Lucide React](https://lucide.dev/) | Ícones modernos |
| [date-fns](https://date-fns.org/) | Manipulação de datas |
| [Vercel](https://vercel.com/) | Deploy e Cron Jobs |

---

## 📁 Estrutura do Projeto

```
finance/
├── app/
│   ├── api/                      # API Routes (server-side)
│   │   ├── balance/route.ts      #   GET/PUT saldo
│   │   ├── transactions/route.ts #   GET/POST/DELETE transações
│   │   ├── bills/route.ts        #   GET/POST/DELETE contas
│   │   └── cleanup/route.ts      #   GET limpeza automática (cron)
│   ├── components/               # Componentes React
│   │   ├── AddTransactionModal.tsx
│   │   ├── AddBillModal.tsx
│   │   ├── SetBalanceModal.tsx
│   │   └── Charts.tsx            #   MonthlyChart, ForecastChart, CategoryChart
│   ├── lib/                      # Lógica e utilitários
│   │   ├── db/
│   │   │   ├── schema.ts         #   Schema Drizzle (tabelas)
│   │   │   └── index.ts          #   Conexão com Neon
│   │   ├── api.ts                #   Client API (fetch helpers)
│   │   ├── finance.ts            #   Cálculos financeiros e previsões
│   │   ├── storage.ts            #   (legacy) localStorage helpers
│   │   └── types.ts              #   TypeScript types e categorias
│   ├── globals.css               # Tema dark, animações, classes utilitárias
│   ├── layout.tsx                # Layout raiz com metadata
│   └── page.tsx                  # Página principal (dashboard)
├── drizzle.config.ts             # Configuração Drizzle Kit
├── vercel.json                   # Cron jobs config
├── .env.local                    # Variáveis de ambiente (não commitado)
├── .env.example                  # Template das variáveis
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 🚀 Instalação e Setup

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- Conta no [Neon](https://neon.tech/) (free tier)
- (Opcional) Conta na [Vercel](https://vercel.com/) para deploy

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/finance.git
cd finance
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus dados:

```bash
cp .env.example .env.local
```

Edite o `.env.local`:

```env
# Connection string do Neon (encontre no painel do Neon → Connection Details)
DATABASE_URL=postgresql://user:senha@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# Secret para proteger a rota de cleanup (gere qualquer string aleatória)
CRON_SECRET=sua-string-aleatoria-aqui
```

### 4. Criar as tabelas no banco

```bash
npm run db:push
```

### 5. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) 🎉

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run start` | Inicia o servidor de produção |
| `npm run lint` | Executa o linter (ESLint) |
| `npm run db:push` | Sincroniza o schema com o banco (cria/atualiza tabelas) |
| `npm run db:generate` | Gera arquivos de migração SQL |
| `npm run db:studio` | Abre o Drizzle Studio (interface visual do banco) |

---

## ☁️ Deploy na Vercel

### 1. Conectar repositório

- Acesse [vercel.com](https://vercel.com/) e importe o repositório

### 2. Configurar variáveis de ambiente

No painel da Vercel, vá em **Settings → Environment Variables** e adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | Sua connection string do Neon |
| `CRON_SECRET` | Sua string secreta para o cron |

### 3. Deploy

O deploy é automático a cada push. O Vercel Cron está configurado no `vercel.json` para executar a limpeza diariamente às 3h UTC.

---

## 🗄️ Banco de Dados

### Schema

**`balance`** — Armazena o saldo atual

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | integer (PK) | Sempre 1 (registro único) |
| `amount` | real | Valor do saldo |
| `updated_at` | timestamp | Última atualização |

**`transactions`** — Histórico de transações

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | text (PK) | ID único gerado |
| `description` | varchar(255) | Descrição da transação |
| `amount` | real | Valor |
| `type` | varchar(10) | `income` ou `expense` |
| `category` | varchar(50) | Categoria (alimentacao, transporte...) |
| `date` | timestamp | Data da transação |
| `created_at` | timestamp | Data de criação |

**`bills`** — Contas fixas e temporárias

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | text (PK) | ID único gerado |
| `name` | varchar(255) | Nome da conta |
| `amount` | real | Valor mensal |
| `category` | varchar(50) | Categoria |
| `bill_type` | varchar(15) | `fixed` ou `temporary` |
| `due_day` | integer | Dia do vencimento (1-31) |
| `total_installments` | integer | Total de parcelas (temporárias) |
| `current_installment` | integer | Parcela atual (temporárias) |
| `start_date` | timestamp | Data de início |
| `active` | boolean | Se a conta está ativa |
| `created_at` | timestamp | Data de criação |

### Limpeza Automática

A rota `/api/cleanup` é chamada diariamente pela Vercel Cron e:

1. **Deleta transações** com mais de 3 meses
2. **Desativa contas temporárias** que já ultrapassaram o total de parcelas
3. **Remove contas inativas** criadas há mais de 3 meses

Isso garante que o banco se mantém dentro do free tier de 512MB do Neon.

---

## 📱 Responsividade

O app foi projetado com **mobile-first**:

- **Mobile**: Navegação inferior (bottom nav) com 4 abas
- **Desktop**: Navegação no header com tabs horizontais
- Layout adaptável com cards que se reorganizam
- Modais otimizados para telas pequenas
- Safe area support para iPhones com notch

---

## 🎨 Design

- **Tema**: Dark mode com tons roxo/violeta
- **Cards**: Efeito glass com bordas gradiente
- **Animações**: Fade-in, slide-up, scale-in suaves
- **Tipografia**: Geist Sans + Geist Mono (Vercel)
- **Gráficos**: Barras, área e pizza com cores coordenadas

---

## 📄 Licença

Este projeto é de uso pessoal. Sinta-se livre para adaptar ao seu uso.
