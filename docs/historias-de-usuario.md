## Histórias de Usuário: Sistema de Moeda Estudantil
---
## Autenticação
HU01: Login
Como usuário (aluno, professor ou empresa parceira), quero me autenticar com login e senha, para acessar as funcionalidades do sistema.
Critérios de aceitação:
O sistema valida as credenciais e redireciona o usuário para a área do seu perfil (aluno, professor ou empresa).
Credenciais inválidas exibem mensagem de erro, sem indicar qual campo está errado.
Nenhuma funcionalidade (exceto login e cadastros públicos) é acessível sem autenticação.
A senha é armazenada com hash.

HU02: Logout
Como usuário autenticado, quero encerrar minha sessão, para impedir que outras pessoas usem minha conta.
Critérios de aceitação:
Após o logout, rotas protegidas redirecionam para o login.
---
## Aluno
HU03: Cadastro de aluno
Como aluno, quero me cadastrar no sistema informando meus dados pessoais e acadêmicos, para participar do programa de mérito.
Critérios de aceitação:
Campos obrigatórios: nome, email, CPF, RG, endereço, instituição, curso, login e senha.
A instituição é selecionada de uma lista de instituições pré-cadastradas.
CPF e email são validados quanto ao formato e à unicidade.
O aluno começa com saldo de 0 moedas.

HU04: Gerenciar perfil do aluno
Como aluno, quero visualizar, editar e excluir meus dados cadastrais, para mantê-los atualizados.
Critérios de aceitação:
CPF não pode ser alterado após o cadastro.
A exclusão exige confirmação.

HU05: Receber notificação de moedas
Como aluno, quero ser notificado por email ao receber moedas, para saber que fui reconhecido e por qual motivo.
Critérios de aceitação:
O email informa o professor, a quantidade de moedas e a mensagem de motivo.
O envio ocorre automaticamente após a transação ser concluída.

HU06: Consultar extrato do aluno
Como aluno, quero consultar meu saldo e meu histórico de transações, para acompanhar minhas moedas.
Critérios de aceitação:
O extrato exibe o saldo atual.
Cada recebimento lista data, professor, quantidade e motivo.
Cada resgate lista data, vantagem, empresa, custo e código do cupom.
As transações aparecem em ordem cronológica decrescente.

HU07: Visualizar vantagens
Como aluno, quero ver as vantagens disponíveis, com descrição, foto e custo, para decidir onde usar minhas moedas.
Critérios de aceitação:
Cada vantagem exibe nome, descrição, foto, custo em moedas e empresa parceira.

HU08: Resgatar vantagem
Como aluno, quero trocar moedas por uma vantagem, para usufruir do meu reconhecimento.
Critérios de aceitação:
O resgate só é permitido se o saldo for maior ou igual ao custo da vantagem.
O custo é debitado do saldo do aluno.
O sistema gera um código único de cupom.
O aluno recebe um email de cupom com o código, para uso na troca presencial.
A transação é registrada no extrato.
---
## Professor
HU09: Enviar moedas
Como professor, quero enviar moedas a um aluno com uma mensagem de reconhecimento, para premiar seu mérito.
Critérios de aceitação:
O professor seleciona o aluno, informa a quantidade e escreve o motivo (obrigatório).
O envio é bloqueado se o saldo for insuficiente ou a quantidade for menor ou igual a zero.
O valor é debitado do professor e creditado ao aluno na mesma transação.
O envio dispara o email da HU05.

HU10: Consultar extrato do professor
Como professor, quero consultar meu saldo e meus envios de moedas, para controlar minha distribuição.
Critérios de aceitação:
O extrato exibe o saldo atual.
Cada envio lista data, aluno, quantidade e motivo.
Empresa parceira

## Empresa Parceira
HU11: Cadastro de empresa parceira
Como empresa, quero me cadastrar no sistema, para oferecer vantagens aos alunos.
Critérios de aceitação:
Campos obrigatórios: dados da empresa, login e senha.
O email é validado quanto à unicidade.

HU12: Gerenciar perfil da empresa
Como empresa parceira, quero visualizar, editar e excluir meus dados, para mantê-los atualizados.

HU13: Cadastrar vantagem
Como empresa parceira, quero cadastrar vantagens com descrição, foto e custo, para disponibilizá-las aos alunos.
Critérios de aceitação:
Campos obrigatórios: nome, descrição, foto e custo em moedas.
O custo deve ser um número inteiro maior que zero.
A vantagem fica visível na listagem da HU07.

HU14: Gerenciar vantagens
Como empresa parceira, quero editar e remover minhas vantagens, para manter minha oferta atualizada.

HU15: Receber email de conferência de resgate
Como empresa parceira, quero receber um email a cada resgate, para conferir a troca presencial.
Critérios de aceitação:
O email contém o mesmo código enviado ao aluno, além do nome do aluno e da vantagem resgatada.
Sistema

## Sistema
HU16: Crédito semestral
Como sistema, quero creditar 1.000 moedas a cada professor no início de cada semestre, para que ele tenha saldo para distribuir.
Critérios de aceitação:
O crédito é somado ao saldo existente, que é acumulável entre semestres.
O crédito ocorre uma única vez por semestre para cada professor.
O crédito é registrado no extrato do professor.