# Estudai Vós

O Estudai Vós é uma aplicação completa para planejamento de estudos, projetada para ajudar estudantes a organizar seus horários, acompanhar o progresso e gerenciar revisões de forma eficaz.

## 🎥 Demonstração em Vídeo

Assista a uma demonstração completa da aplicação e suas funcionalidades no vídeo abaixo:

**[➡️ Assistir à demonstração no YouTube](https://youtu.be/cTVlvHOR89g)**

## ✨ Funcionalidades

- **Planejamento de Estudos por Ciclos:** Crie e gerencie ciclos de estudo com base em editais ou objetivos específicos.
- **Registro de Sessões:** Registre sessões de estudo para diferentes matérias, monitorando o tempo e o conteúdo estudado.
- **Estatísticas de Desempenho:** Visualize sua distribuição de estudos e desempenho com gráficos dinâmicos (progresso semanal, horas por matéria, etc.).
- **Gerenciamento de Revisões:** Agende e acompanhe revisões para garantir a retenção do conteúdo a longo prazo.
- **Acompanhamento de Simulados:** Registre os resultados dos simulados para monitorar sua evolução.
- **Cronômetro Integrado:** Utilize um cronômetro para marcar o tempo de estudo com precisão.
- **Matérias e Tópicos Personalizáveis:** Adicione suas próprias matérias e tópicos para adaptar o planejador às suas necessidades.
- **Modo Claro e Escuro:** Alterne entre temas para uma visualização mais confortável.
- **Interface com Drag-and-Drop:** Reordene e gerencie facilmente seus itens de estudo.

## 🚀 Tecnologias Utilizadas

- **Framework:** [Next.js](https://nextjs.org/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes de UI:** [Radix UI](https://www.radix-ui.com/) & [Ícones Lucide](https://lucide.dev/)
- **Visualização de Dados:** [Chart.js](https://www.chartjs.org/)
- **Drag & Drop:** [dnd-kit](https://dndkit.com/)
- **Gerenciamento de Datas:** [date-fns](https://date-fns.org/)

## 🏁 Como Começar

Siga estas instruções para obter uma cópia do projeto e executá-lo em sua máquina local.

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) (versão 20.x ou superior recomendada)
- [npm](https://www.npmjs.com/)

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/grebsu/Estudai-Vos.git
   ```
2. Navegue até o diretório do projeto:
   ```bash
   cd Estudai-Vos
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```

### Executando a Aplicação

#### Modo de Desenvolvimento

Para iniciar o servidor de desenvolvimento:
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

#### Modo de Produção (Recomendado)

Para uma implantação robusta que reinicia com o sistema, recomendamos o uso do `pm2`.

1.  **Instale o pm2 globalmente:**
    ```bash
    npm install pm2 -g
    ```

2.  **Crie a build de produção do projeto:**
    ```bash
    npm run build
    ```

3.  **Inicie a aplicação com o pm2:**
    ```bash
    pm2 start npm --name "Estudai-Vos" -- run start
    ```

4.  **Configure o pm2 para iniciar com o sistema:**
    ```bash
    pm2 startup
    ```
    *Este comando irá gerar outro que você precisará copiar e executar para finalizar a configuração.*

5.  **Salve a configuração atual do pm2:**
    ```bash
    pm2 save
    ```

## 📄 Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.