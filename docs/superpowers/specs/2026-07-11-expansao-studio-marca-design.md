# Expansão pra loja física + equipe — decisões de marca e cronograma

**Data:** 2026-07-11
**Status:** Aprovado (decisão de marca), cronograma em execução

## Contexto

Jon está saindo do atendimento em casa pra um salão físico numa rua, com abertura prevista pra **agosto de 2026**, e quer adicionar mais profissionais à equipe. O negócio hoje tem duas identidades convivendo sem hierarquia clara: "Studio do Jon" (usado no hero, FAQ, textos internos) e "O Jon que Cortou" (nome do domínio, GBP, entrada no Wikidata Q140387726, logo do nav).

## Decisões de marca

### Hierarquia de nomes

- **Studio do Jon** = nome do espaço físico. Placa da rua, uniforme, "trabalho no ___", ponto no Google Maps, assinatura de e-mail da equipe. Escala bem pra múltiplos profissionais sem soar estranho quando quem atende não é o Jon.
- **O Jon que Cortou** = marca/entidade oficial. Domínio (`ojonquecortou.com.br`), Google Business Profile, Wikidata, schema.org do site, tagline institucional. **Não muda** — mantém todo o histórico de citação/NAP já construído.

Regra prática: físico/local → Studio do Jon. Digital/institucional → O Jon que Cortou, com "Studio do Jon" como subtítulo/descrição.

**Por quê essa direção e não trocar tudo pra um nome só:** trocar o nome registrado no GBP ao mesmo tempo que muda o endereço multiplica o risco de demora na reverificação do Google — o processo mais lento e mais crítico do cronograma de abertura. Mantendo o nome do GBP como já está e só atualizando o endereço, elimina-se uma variável inteira desse gargalo.

### Método Leitura de Fio na equipe

Leitura de Fio deixa de ser exclusividade pessoal do Jon e vira **padrão do Studio para qualquer profissional que corte cabelo cacheado/crespo**. Jon treina os novos especialistas no método. Serviços fora do nicho de corte de cachos (o Studio não oferece liso nem barbearia — diversificação futura fica dentro do próprio nicho: mais tipos de tratamento, coloração pra cacho, atendimento infantil etc.) não passam pelo método, o que é esperado e não gera inconsistência.

Jon confirmou que pretende continuar atendendo pessoalmente sempre (não migra pra papel só de dono/treinador) — o modelo de preço abaixo reflete isso.

### Estrutura de preço: Jon vs. equipe

Faixa recomendada: **25–40% de premium** pro Jon sobre o preço da equipe. Diferença pequena demais não tira demanda do Jon (equipe não enche a agenda); diferença grande demais desvaloriza o trabalho da equipe.

- **Equipe (treinada em Leitura de Fio):** próximo ao preço atual, ~R$170–200. Não é "desconto" — é preço justo de especialista treinado no método.
- **Jon (fundador):** sobe pra ~R$250–320, refletindo demanda/fila/reputação já construída sozinho, não só "porque é o nome".

Recomendações de execução:
1. Agendamento deve deixar explícito **por profissional**, não só por serviço, pra a diferença de preço ser consciente e legível.
2. O preço do Jon deveria ter um motivo concreto além do nome (sessão mais longa, follow-up, prioridade de reagendamento).
3. Conforme a equipe ganha reputação própria, o preço deles sobe e o do Jon acompanha — é assim que um estúdio de fundador escala sem virar gargalo nem parecer "caro à toa".

## Cronograma de abertura (referência: hoje = 2026-07-11)

**Semana 1 (11–18/jul) — decisões que travam o resto:**
- [ ] Placa: confirmar "Studio do Jon" como nome físico e encomendar fabricação (lead time)
- [ ] Iniciar hoje o processo de mudança de endereço no Google Business Profile (reverificação é o item mais lento do cronograma)
- [ ] Definir número de contratações e papéis (quem aplica Leitura de Fio)
- [ ] Iniciar entrevistas/contratação — treino leva dias, não pode ficar pra última semana

**Semana 2 (18–25/jul):**
- [ ] Fechar tabela de preços (Jon vs. equipe)
- [ ] Encomendar sinalização/materiais físicos restantes
- [ ] Iniciar treino de Leitura de Fio pra quem for aplicar
- [ ] Atualizar site: agendamento por profissional, preços em `/investimento`, endereço novo no schema/rodapé

**Semana 3 (25/jul–1/ago):**
- [ ] Confirmar GBP verificado com endereço novo no ar
- [ ] Sincronizar endereço em todos os diretórios/listagens (Trinks está com nome legado "Ateliê dos Cachos MG" — atualizar junto; checar redes sociais)
- [ ] Dry-run da equipe antes do primeiro cliente real

**Semana 4 (a partir de 1/ago):** abertura.

## Próximos passos técnicos (site)

Quando o endereço/equipe estiverem confirmados, isso vira trabalho de código:
- Atualizar endereço no `LocalBusiness` schema (`scripts/prerender.js`) e no rodapé/`ContactCTA`
- Adicionar seleção de profissional no fluxo de agendamento
- Atualizar `/investimento` e `/servicos` com os dois níveis de preço
- Revisar `openingHoursSpecification` se o horário mudar com a loja física
- Sincronizar NAP (nome/endereço/telefone) em GBP, Trinks e redes sociais no mesmo lote, pra evitar inconsistência temporária durante a transição
