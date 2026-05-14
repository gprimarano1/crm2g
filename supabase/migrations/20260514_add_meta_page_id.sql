-- Adiciona meta_page_id na tabela clientes
-- Usado pelo webhook para identificar o cliente pelo Facebook Page ID

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS meta_page_id text;

-- Índice para busca eficiente no webhook
CREATE INDEX IF NOT EXISTS clientes_meta_page_id_idx
  ON clientes (meta_page_id)
  WHERE meta_page_id IS NOT NULL;
