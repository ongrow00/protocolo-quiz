export interface LegalDoc {
	title: string;
	updatedAt: string;
	html: string;
}

const UPDATED = 'Maio de 2026';
const CNPJ = '38.312.105/0001-59';
const EMPRESA = 'Protocolo Desbloqueio';
const SUPORTE = 'pelo canal oficial de suporte (WhatsApp ou e-mail disponível no rodapé do site)';

export const LEGAL_DOCS: Record<string, LegalDoc> = {
	'termos-de-uso': {
		title: 'Termos de Uso',
		updatedAt: UPDATED,
		html: `
<h2>1. Identificação</h2>
<p>${EMPRESA}, inscrito no CNPJ ${CNPJ} ("Protocolo Desbloqueio", "nós" ou "nosso"), disponibiliza este site e plataforma digital ("Plataforma") para a comercialização e entrega do Protocolo de Desbloqueio, produto digital de orientação nutricional e de hábitos de vida ("Produto").</p>

<h2>2. Aceitação</h2>
<p>Ao acessar ou utilizar a Plataforma, ou ao adquirir qualquer Produto, você ("Usuário") declara ter lido, compreendido e concordado integralmente com estes Termos. Caso não concorde, interrompa o uso imediatamente.</p>

<h2>3. Elegibilidade</h2>
<p>O uso da Plataforma é restrito a pessoas com 18 anos ou mais e plenamente capazes de assumir obrigações legais. Ao utilizar a Plataforma, você confirma preencher esses requisitos.</p>

<h2>4. Descrição do Produto</h2>
<p>O Protocolo de Desbloqueio é um produto digital de orientação nutricional personalizada, elaborado com base nas informações fornecidas pelo Usuário em questionário de triagem. O Produto inclui:</p>
<ul>
  <li>Protocolo nutricional personalizado de 14 dias, dividido em 4 etapas (Desbloqueio, Aceleração, Consolidação e Finalização)</li>
  <li>Plano alimentar com base no perfil metabólico do Usuário</li>
  <li>Acesso ao aplicativo</li>
  <li>Acompanhamento via WhatsApp pela equipe de suporte durante os 14 dias</li>
  <li>Materiais complementares: Mapa dos 14 Dias e Guia do Fim de Semana</li>
</ul>
<p>O protocolo é elaborado sob supervisão do nutricionista Lucas Rabelo (CRN 458.787.445).</p>

<h2>5. Caráter Educativo e Limites em Saúde</h2>
<p>As informações e orientações do Produto possuem caráter estritamente educativo e informativo. <strong>O Produto não substitui consulta, diagnóstico ou tratamento médico, nutricional ou de qualquer profissional de saúde.</strong> O Usuário é exclusivamente responsável por consultar profissional habilitado antes de iniciar qualquer programa alimentar ou de atividade física, especialmente em caso de doenças preexistentes, gestação, lactação ou uso de medicamentos.</p>

<h2>6. Resultados</h2>
<p>Os resultados descritos neste site são ilustrativos e podem variar conforme condições individuais de saúde, metabolismo e aderência ao protocolo. O ${EMPRESA} não garante resultados específicos além dos previstos na Política de Garantia de Reembolso.</p>

<h2>7. Aquisição e Pagamento</h2>
<p>O Produto é comercializado em modelo de <strong>compra única</strong>, sem cobrança recorrente. O preço vigente é exibido na página de vendas no momento da compra. O pagamento é processado por plataforma de pagamento terceirizada, segura e certificada.</p>

<h2>8. Propriedade Intelectual</h2>
<p>Todo o conteúdo da Plataforma — textos, imagens, protocolos, materiais digitais — é de propriedade exclusiva do ${EMPRESA} ou licenciado por seus criadores. É vedada a reprodução, distribuição, revenda ou criação de obras derivadas sem autorização prévia e expressa, sob pena das sanções civis e penais cabíveis.</p>

<h2>9. Conduta do Usuário</h2>
<p>É vedado ao Usuário:</p>
<ul>
  <li>Compartilhar, revender ou redistribuir o conteúdo adquirido</li>
  <li>Utilizar a Plataforma para fins ilícitos ou em violação a direitos de terceiros</li>
  <li>Fornecer informações falsas no questionário de triagem</li>
  <li>Interferir no funcionamento técnico da Plataforma</li>
</ul>

<h2>10. Limitação de Responsabilidade</h2>
<p>Na extensão máxima permitida por lei, o ${EMPRESA} não se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes do uso ou incapacidade de uso da Plataforma ou do Produto. A responsabilidade total máxima não excederá o valor pago pelo Usuário pelo Produto.</p>

<h2>11. Alterações dos Termos</h2>
<p>Estes Termos podem ser atualizados periodicamente. A versão vigente é sempre a publicada nesta página, com indicação da data de atualização. O uso continuado da Plataforma após alterações constitui aceitação dos novos termos.</p>

<h2>12. Legislação e Foro</h2>
<p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Para dirimir eventuais controvérsias, fica eleito o foro do domicílio do Usuário, nos termos do Art. 101, I, do Código de Defesa do Consumidor.</p>
`
	},

	'politica-de-privacidade': {
		title: 'Política de Privacidade',
		updatedAt: UPDATED,
		html: `
<h2>1. Controlador dos Dados</h2>
<p>${EMPRESA}, CNPJ ${CNPJ}, é o Controlador de Dados Pessoais, nos termos da Lei nº 13.709/2018 — Lei Geral de Proteção de Dados ("LGPD").</p>

<h2>2. Dados Coletados</h2>
<p>Coletamos as seguintes categorias de dados pessoais:</p>

<h3>a) Identificação e contato</h3>
<ul>
  <li>Nome completo</li>
  <li>Endereço de e-mail</li>
  <li>Número de WhatsApp</li>
</ul>

<h3>b) Dados corporais e de saúde</h3>
<ul>
  <li>Peso atual e meta de peso</li>
  <li>Altura e idade</li>
  <li>Nível de atividade física</li>
  <li>Estimativa de composição corporal</li>
  <li>Sexo biológico</li>
  <li>Uso de medicamentos para emagrecimento (incluindo GLP-1 e similares)</li>
</ul>

<h3>c) Dados de uso e navegação</h3>
<ul>
  <li>Respostas ao questionário de triagem</li>
  <li>Parâmetros UTM (origem de tráfego de marketing: utm_source, utm_medium, utm_campaign)</li>
  <li>Identificador de sessão anônimo</li>
  <li>Dados de interação com a Plataforma (tempo de resposta, progresso no funil)</li>
</ul>

<h2>3. Finalidade e Base Legal</h2>
<p>Tratamos seus dados para as seguintes finalidades e com as respectivas bases legais (LGPD, Art. 7º):</p>
<ul>
  <li><strong>Personalização e entrega do Produto</strong> — execução de contrato (inciso V)</li>
  <li><strong>Envio do protocolo por e-mail e WhatsApp</strong> — execução de contrato (inciso V)</li>
  <li><strong>Suporte durante os 14 dias</strong> — execução de contrato (inciso V)</li>
  <li><strong>Comunicações de marketing relacionadas ao Produto</strong> — consentimento (inciso I)</li>
  <li><strong>Cumprimento de obrigações legais e fiscais</strong> — obrigação legal (inciso II)</li>
  <li><strong>Análises estatísticas e melhoria da Plataforma</strong> — legítimo interesse (inciso IX)</li>
</ul>

<h2>4. Dados de Saúde</h2>
<p>Dados relativos à saúde (peso, uso de medicamentos, composição corporal) são classificados como dados sensíveis sob a LGPD e recebem tratamento com proteção reforçada. São utilizados <strong>exclusivamente</strong> para personalização do Produto adquirido e não são compartilhados para fins comerciais.</p>

<h2>5. Compartilhamento de Dados</h2>
<p>Seus dados podem ser compartilhados com os seguintes tipos de destinatários, estritamente para as finalidades descritas:</p>
<ul>
  <li><strong>Infraestrutura e banco de dados:</strong> Supabase (armazenamento seguro dos dados de cadastro e respostas)</li>
  <li><strong>Plataforma de pagamento:</strong> processador de pagamento terceirizado utilizado no checkout (dados financeiros são tratados diretamente por essa plataforma)</li>
  <li><strong>Ferramentas de comunicação:</strong> serviços de envio de e-mail e mensagens para entrega do Produto e suporte</li>
  <li><strong>Plataformas de publicidade digital:</strong> Facebook/Meta e Google, em formato de audiência com dados anonimizados ou pseudonimizados (hashed), mediante consentimento, para fins de publicidade relevante</li>
</ul>
<p><strong>Não vendemos seus dados pessoais a terceiros.</strong></p>

<h2>6. Transferência Internacional de Dados</h2>
<p>Alguns de nossos fornecedores de infraestrutura operam fora do Brasil. Nesse caso, adotamos as salvaguardas exigidas pela LGPD para garantir que seus dados recebam proteção equivalente à da legislação brasileira.</p>

<h2>7. Retenção de Dados</h2>
<ul>
  <li><strong>Dados de cadastro e contato:</strong> mantidos por até 5 anos após a última interação, para fins de suporte e cumprimento legal</li>
  <li><strong>Dados de saúde:</strong> excluídos ou anonimizados em até 24 meses após a última interação, salvo consentimento expresso para retenção</li>
  <li><strong>Dados financeiros:</strong> retidos conforme exigência fiscal (mínimo 5 anos)</li>
  <li><strong>Solicitação de exclusão:</strong> processada em até 15 dias úteis após a solicitação</li>
</ul>

<h2>8. Seus Direitos (LGPD, Art. 18)</h2>
<p>Você tem direito a, a qualquer momento:</p>
<ul>
  <li><strong>Confirmação e acesso</strong> — saber se tratamos seus dados e obter cópia</li>
  <li><strong>Correção</strong> — atualizar dados incompletos, inexatos ou desatualizados</li>
  <li><strong>Anonimização, bloqueio ou eliminação</strong> — de dados desnecessários ou tratados em desconformidade</li>
  <li><strong>Portabilidade</strong> — receber seus dados em formato estruturado e interoperável</li>
  <li><strong>Revogação do consentimento</strong> — para tratamentos baseados em consentimento</li>
  <li><strong>Oposição</strong> — ao tratamento baseado em legítimo interesse</li>
  <li><strong>Informação sobre compartilhamento</strong> — saber com quais entidades seus dados foram compartilhados</li>
  <li><strong>Revisão de decisões automatizadas</strong> — solicitar revisão humana de perfis criados de forma automatizada</li>
</ul>
<p>Para exercer seus direitos, entre em contato ${SUPORTE}.</p>

<h2>9. Cookies e Rastreamento</h2>
<p>Utilizamos cookies e tecnologias similares para funcionamento da Plataforma, análise de desempenho e personalização de anúncios. Cookies essenciais são necessários para o funcionamento do site. Cookies de marketing e análise dependem do seu consentimento.</p>

<h2>10. Segurança</h2>
<p>Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo: criptografia em trânsito (HTTPS/TLS), controle de acesso baseado em função, armazenamento em provedores certificados e revisões periódicas de segurança. Em caso de incidente de segurança que possa afetar seus dados, notificaremos você e a Autoridade Nacional de Proteção de Dados (ANPD) conforme exigido pela LGPD.</p>

<h2>11. Contato e Encarregado (DPO)</h2>
<p>Para dúvidas, solicitações ou exercício dos seus direitos, entre em contato ${SUPORTE}. Nosso encarregado pelo tratamento de dados pessoais está disponível pelo mesmo canal.</p>

<h2>12. Alterações</h2>
<p>Esta Política pode ser atualizada periodicamente. Alterações materiais serão comunicadas por e-mail ou WhatsApp para usuários cadastrados, com antecedência mínima de 15 dias.</p>
`
	},

	'politica-de-assinatura': {
		title: 'Política de Acesso ao Produto',
		updatedAt: UPDATED,
		html: `
<h2>1. Modelo de Compra</h2>
<p>O Protocolo de Desbloqueio é comercializado exclusivamente como <strong>compra única</strong>. <strong>Não há cobrança recorrente, assinatura mensal ou qualquer débito automático</strong> após a aquisição.</p>

<h2>2. Preço e Condições Comerciais</h2>
<p>O preço vigente é exibido na página de vendas no momento da compra. Eventuais promoções ou condições especiais têm validade limitada ao período indicado e não se acumulam com outras ofertas.</p>
<p>O parcelamento no cartão de crédito, quando disponível, é processado pela plataforma de pagamento parceira e sujeito às condições da operadora do cartão do Usuário. O valor total da compra não se altera pelo parcelamento.</p>

<h2>3. Formas de Pagamento</h2>
<p>São aceitas as formas de pagamento disponibilizadas pela plataforma de checkout no momento da compra, podendo incluir:</p>
<ul>
  <li>Cartão de crédito (parcelamento disponível)</li>
  <li>Pix</li>
  <li>Apple Pay e Google Pay</li>
  <li>Outras formas conforme disponibilidade</li>
</ul>

<h2>4. Confirmação e Entrega</h2>
<p>Após a confirmação do pagamento:</p>
<ul>
  <li>O protocolo personalizado e os materiais inclusos serão enviados para o <strong>e-mail cadastrado em até 24 horas úteis</strong></li>
  <li>O protocolo completo também será enviado diretamente <strong>via WhatsApp</strong> pela equipe de suporte</li>
  <li>As instruções de acesso ao aplicativo serão encaminhadas junto ao protocolo</li>
</ul>
<p>Caso não receba o material no prazo indicado, verifique a pasta de spam antes de entrar em contato com o suporte.</p>

<h2>5. Conteúdo Incluído na Compra</h2>
<ul>
  <li><strong>Protocolo de Desbloqueio Personalizado</strong> — plano nutricional de 14 dias em 4 etapas, calculado com base no seu perfil metabólico</li>
  <li><strong>Plano Alimentar Personalizado</strong> — refeições práticas adaptadas à sua rotina</li>
  <li><strong>Acesso ao Aplicativo</strong> — acompanhamento digital do protocolo</li>
  <li><strong>Acompanhamento via WhatsApp</strong> — suporte direto da equipe durante os 14 dias do protocolo</li>
  <li><strong>Mapa dos 14 Dias</strong> — checklist diário de acompanhamento</li>
  <li><strong>Guia do Fim de Semana</strong> — estratégias para manter o protocolo em situações sociais</li>
</ul>
<p>Usuários que indicaram uso de medicamentos para emagrecimento receberão orientações adicionais adaptadas ao seu contexto.</p>

<h2>6. Vigência do Acesso</h2>
<p>O acesso ao conteúdo digital e ao aplicativo é concedido por <strong>prazo indeterminado</strong> a partir da data de entrega. Em caso de necessidade de interrupção ou alteração do serviço, o ${EMPRESA} notificará os usuários com antecedência mínima de 30 dias, assegurando o acesso ao conteúdo já entregue.</p>

<h2>7. Atualizações de Conteúdo</h2>
<p>O ${EMPRESA} pode atualizar ou aprimorar o conteúdo do Produto periodicamente. Melhorias e atualizações serão disponibilizadas sem custo adicional para quem já adquiriu o Produto.</p>

<h2>8. Cancelamento e Reembolso</h2>
<p>Consulte a <a href="/legal/garantia-de-reembolso">Política de Garantia de Reembolso</a> para informações completas sobre cancelamento e devolução de valores.</p>
`
	},

	'garantia-de-reembolso': {
		title: 'Garantia de Reembolso',
		updatedAt: UPDATED,
		html: `
<h2>1. Nossa Garantia</h2>
<p>Confiamos plenamente no Protocolo de Desbloqueio. Por isso, oferecemos duas camadas de proteção ao seu investimento: o direito legal de arrependimento e uma garantia de satisfação estendida.</p>

<h2>2. Direito de Arrependimento — 7 Dias (CDC)</h2>
<p>Nos termos do Art. 49 do Código de Defesa do Consumidor, você tem o direito de desistir da compra em até <strong>7 (sete) dias corridos</strong> contados da data da aquisição, <strong>sem necessidade de justificativa</strong>, com devolução integral do valor pago.</p>
<p>Esse direito se aplica a qualquer compra realizada à distância (internet) e independe de você ter acessado ou utilizado o Produto.</p>

<h2>3. Garantia de Satisfação — 14 Dias</h2>
<p>Além do direito legal, oferecemos uma <strong>Garantia de Satisfação de 14 Dias</strong>: se você realizar o protocolo completo e, ao final dos 14 dias, não estiver satisfeito com os resultados, devolvemos <strong>100% do valor pago</strong>, sem questionamentos.</p>
<p>Essa garantia demonstra nossa confiança no método e no trabalho do nosso time.</p>

<h2>4. Como Solicitar o Reembolso</h2>

<h3>Arrependimento (até 7 dias corridos da compra)</h3>
<ol>
  <li>Entre em contato ${SUPORTE}</li>
  <li>Informe: "Solicitação de Reembolso — Arrependimento"</li>
  <li>Forneça o nome e e-mail utilizados na compra</li>
  <li>Não é necessária nenhuma justificativa</li>
</ol>

<h3>Garantia de 14 dias (após uso do protocolo)</h3>
<ol>
  <li>Realize o protocolo completo durante os 14 dias</li>
  <li>Caso não esteja satisfeito, entre em contato ${SUPORTE} dentro do prazo de 14 dias corridos a partir da data da compra</li>
  <li>Informe: "Solicitação de Reembolso — Garantia 14 Dias"</li>
  <li>Forneça o nome e e-mail utilizados na compra</li>
</ol>

<h2>5. Prazo de Processamento</h2>
<p>Após a aprovação da solicitação:</p>
<ul>
  <li><strong>Pix:</strong> reembolso em até 5 dias úteis</li>
  <li><strong>Cartão de crédito:</strong> estorno em até 7 dias úteis; o crédito na fatura pode levar até 2 ciclos de faturamento, conforme a operadora do cartão</li>
  <li><strong>Outros meios:</strong> prazo acordado com o Usuário no momento da solicitação</li>
</ul>

<h2>6. Forma do Reembolso</h2>
<p>O reembolso será realizado pelo mesmo meio de pagamento utilizado na compra. Em caso de impossibilidade técnica, acordaremos outra forma de devolução com o Usuário.</p>

<h2>7. Dúvidas</h2>
<p>Para qualquer dúvida sobre a garantia, entre em contato ${SUPORTE}. Nossa equipe está disponível para ajudar.</p>
`
	}
};
