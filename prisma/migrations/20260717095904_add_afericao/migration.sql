-- CreateTable
CREATE TABLE "afericao" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "empresa_id" UUID NOT NULL,
    "equipamento_id" UUID NOT NULL,
    "data_afericao" DATE NOT NULL,
    "data_validade" DATE NOT NULL,
    "orgao_responsavel" VARCHAR(150) NOT NULL,
    "numero_certificado" VARCHAR(100),
    "anexo_certificado_url" TEXT,
    "observacoes" TEXT,
    "criado_por_id" UUID,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "afericao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "base" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "empresa_id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'filial',
    "estado" CHAR(2) NOT NULL,
    "cidade" VARCHAR(100),
    "endereco" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrato" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "empresa_id" UUID NOT NULL,
    "numero_contrato" VARCHAR(100) NOT NULL,
    "orgao_contratante" VARCHAR(255) NOT NULL,
    "sla_horas_atendimento" INTEGER NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ativo',

    CONSTRAINT "contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresa" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "razao_social" VARCHAR(255) NOT NULL,
    "cnpj" VARCHAR(18) NOT NULL,
    "plano_id" UUID,
    "status_assinatura" VARCHAR(20) NOT NULL DEFAULT 'trial',
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "empresa_id" UUID NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "numero_serie" VARCHAR(100),
    "modelo" VARCHAR(100),
    "fabricante" VARCHAR(100),
    "localizacao_instalacao" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "base_responsavel_id" UUID NOT NULL,
    "contrato_id" UUID,
    "status_operacional" VARCHAR(30) NOT NULL DEFAULT 'ativo',
    "qr_code" VARCHAR(50) NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoque_minimo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "empresa_id" UUID NOT NULL,
    "base_id" UUID NOT NULL,
    "categoria_peca" VARCHAR(100) NOT NULL,
    "quantidade_minima" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "estoque_minimo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_auditoria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "empresa_id" UUID NOT NULL,
    "entidade" VARCHAR(50) NOT NULL,
    "entidade_id" UUID NOT NULL,
    "acao" VARCHAR(50) NOT NULL,
    "usuario_id" UUID,
    "dados_anteriores" JSONB,
    "dados_novos" JSONB,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacao" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "empresa_id" UUID NOT NULL,
    "peca_id" UUID NOT NULL,
    "origem_tipo" VARCHAR(20) NOT NULL,
    "origem_id" UUID NOT NULL,
    "destino_tipo" VARCHAR(20) NOT NULL,
    "destino_id" UUID NOT NULL,
    "data_envio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codigo_rastreio" VARCHAR(100),
    "transportadora" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'enviada',
    "motivo_envio" VARCHAR(30) NOT NULL,
    "descricao_problema" TEXT,
    "equipamento_id" UUID,
    "contrato_id" UUID,
    "ordem_servico_id" UUID,
    "causou_parada" BOOLEAN DEFAULT false,
    "data_inicio_parada" TIMESTAMPTZ(6),
    "data_fim_parada" TIMESTAMPTZ(6),
    "registrado_offline" BOOLEAN DEFAULT false,
    "sincronizado_em" TIMESTAMPTZ(6),
    "latitude_registro" DECIMAL(10,7),
    "longitude_registro" DECIMAL(10,7),
    "data_confirmacao_recebimento" TIMESTAMPTZ(6),
    "usuario_responsavel_id" UUID,
    "usuario_confirmou_id" UUID,
    "tipo_aquisicao" VARCHAR(30),
    "numero_ordem_compra" VARCHAR(100),
    "previsao_retorno" DATE,
    "observacao_envio" TEXT,

    CONSTRAINT "movimentacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordem_servico" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "empresa_id" UUID NOT NULL,
    "equipamento_id" UUID NOT NULL,
    "tecnico_id" UUID,
    "tipo" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'aberta',
    "data_abertura" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_conclusao" TIMESTAMPTZ(6),

    CONSTRAINT "ordem_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peca" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "empresa_id" UUID NOT NULL,
    "codigo_qr" VARCHAR(50) NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "categoria" VARCHAR(100) NOT NULL,
    "status_atual" VARCHAR(30) NOT NULL DEFAULT 'em_estoque_base',
    "base_atual_id" UUID,
    "tecnico_atual_id" UUID,
    "equipamento_atual_id" UUID,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "peca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(50) NOT NULL,
    "limite_bases" INTEGER,
    "limite_pecas" INTEGER,
    "limite_usuarios" INTEGER,
    "preco_mensal" DECIMAL(10,2),

    CONSTRAINT "plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tecnico" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "empresa_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "base_vinculada_id" UUID NOT NULL,
    "veiculo" VARCHAR(100),
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "empresa_id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha_hash" VARCHAR(255),
    "papel" VARCHAR(20) NOT NULL,
    "base_id" UUID,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "empresa_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "cnpj" VARCHAR(18),
    "tipo" VARCHAR(20) NOT NULL,
    "contato" VARCHAR(150),
    "email" VARCHAR(255),
    "telefone" VARCHAR(20),
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_afericao_empresa" ON "afericao"("empresa_id");

-- CreateIndex
CREATE INDEX "idx_afericao_equipamento" ON "afericao"("equipamento_id");

-- CreateIndex
CREATE INDEX "idx_base_empresa" ON "base"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "empresa_cnpj_key" ON "empresa"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "equipamento_qr_code_key" ON "equipamento"("qr_code");

-- CreateIndex
CREATE INDEX "idx_equipamento_empresa" ON "equipamento"("empresa_id", "status_operacional");

-- CreateIndex
CREATE UNIQUE INDEX "estoque_minimo_base_id_categoria_peca_key" ON "estoque_minimo"("base_id", "categoria_peca");

-- CreateIndex
CREATE INDEX "idx_log_auditoria_entidade" ON "log_auditoria"("empresa_id", "entidade", "entidade_id");

-- CreateIndex
CREATE INDEX "idx_movimentacao_contrato" ON "movimentacao"("contrato_id");

-- CreateIndex
CREATE INDEX "idx_movimentacao_empresa_status" ON "movimentacao"("empresa_id", "status");

-- CreateIndex
CREATE INDEX "idx_movimentacao_equipamento" ON "movimentacao"("equipamento_id");

-- CreateIndex
CREATE INDEX "idx_movimentacao_peca" ON "movimentacao"("peca_id");

-- CreateIndex
CREATE UNIQUE INDEX "peca_codigo_qr_key" ON "peca"("codigo_qr");

-- CreateIndex
CREATE INDEX "idx_peca_empresa" ON "peca"("empresa_id");

-- CreateIndex
CREATE INDEX "idx_usuario_empresa" ON "usuario"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_empresa_id_email_key" ON "usuario"("empresa_id", "email");

-- AddForeignKey
ALTER TABLE "afericao" ADD CONSTRAINT "afericao_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "afericao" ADD CONSTRAINT "afericao_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamento"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "afericao" ADD CONSTRAINT "afericao_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "base" ADD CONSTRAINT "base_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "empresa" ADD CONSTRAINT "empresa_plano_id_fkey" FOREIGN KEY ("plano_id") REFERENCES "plano"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "equipamento" ADD CONSTRAINT "equipamento_base_responsavel_id_fkey" FOREIGN KEY ("base_responsavel_id") REFERENCES "base"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "equipamento" ADD CONSTRAINT "equipamento_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contrato"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "equipamento" ADD CONSTRAINT "equipamento_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "estoque_minimo" ADD CONSTRAINT "estoque_minimo_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "base"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "estoque_minimo" ADD CONSTRAINT "estoque_minimo_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "log_auditoria" ADD CONSTRAINT "log_auditoria_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "log_auditoria" ADD CONSTRAINT "log_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contrato"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamento"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordem_servico"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_peca_id_fkey" FOREIGN KEY ("peca_id") REFERENCES "peca"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_usuario_confirmou_id_fkey" FOREIGN KEY ("usuario_confirmou_id") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_usuario_responsavel_id_fkey" FOREIGN KEY ("usuario_responsavel_id") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ordem_servico" ADD CONSTRAINT "ordem_servico_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ordem_servico" ADD CONSTRAINT "ordem_servico_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamento"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ordem_servico" ADD CONSTRAINT "ordem_servico_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "tecnico"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "peca" ADD CONSTRAINT "peca_base_atual_id_fkey" FOREIGN KEY ("base_atual_id") REFERENCES "base"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "peca" ADD CONSTRAINT "peca_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "peca" ADD CONSTRAINT "peca_equipamento_atual_id_fkey" FOREIGN KEY ("equipamento_atual_id") REFERENCES "equipamento"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "peca" ADD CONSTRAINT "peca_tecnico_atual_id_fkey" FOREIGN KEY ("tecnico_atual_id") REFERENCES "tecnico"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tecnico" ADD CONSTRAINT "tecnico_base_vinculada_id_fkey" FOREIGN KEY ("base_vinculada_id") REFERENCES "base"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tecnico" ADD CONSTRAINT "tecnico_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tecnico" ADD CONSTRAINT "tecnico_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "fk_usuario_base" FOREIGN KEY ("base_id") REFERENCES "base"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fornecedor" ADD CONSTRAINT "fornecedor_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
