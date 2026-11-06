CREATE TABLE IF NOT EXISTS rulesets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catalog_attributes (
  id TEXT PRIMARY KEY,
  ruleset_id TEXT NOT NULL REFERENCES rulesets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS catalog_schools (
  id TEXT PRIMARY KEY,
  ruleset_id TEXT NOT NULL REFERENCES rulesets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS catalog_arcanas (
  id TEXT PRIMARY KEY,
  ruleset_id TEXT NOT NULL REFERENCES rulesets(id) ON DELETE CASCADE,
  school_id TEXT NOT NULL REFERENCES catalog_schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS catalog_weapon_groups (
  id TEXT PRIMARY KEY,
  ruleset_id TEXT NOT NULL REFERENCES rulesets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS catalog_degrees (
  id TEXT PRIMARY KEY,
  ruleset_id TEXT NOT NULL REFERENCES rulesets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO rulesets (id, name)
VALUES ('dragon-age-age', 'Dragon Age / Fantasy AGE 2e')
ON CONFLICT (id) DO NOTHING;

INSERT INTO catalog_attributes (id, ruleset_id, name, abbreviation, sort_order) VALUES
  ('attr-ast', 'dragon-age-age', 'Astúcia', 'AST', 0),
  ('attr-com', 'dragon-age-age', 'Comunicação', 'COM', 1),
  ('attr-con', 'dragon-age-age', 'Constituição', 'CON', 2),
  ('attr-des', 'dragon-age-age', 'Destreza', 'DES', 3),
  ('attr-for', 'dragon-age-age', 'Força', 'FOR', 4),
  ('attr-lut', 'dragon-age-age', 'Luta', 'LUT', 5),
  ('attr-per', 'dragon-age-age', 'Percepção', 'PER', 6),
  ('attr-pre', 'dragon-age-age', 'Precisão', 'PRE', 7),
  ('attr-von', 'dragon-age-age', 'Vontade', 'VON', 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO catalog_schools (id, ruleset_id, name, sort_order) VALUES
  ('school-criacao', 'dragon-age-age', 'Criação', 0),
  ('school-entropia', 'dragon-age-age', 'Entropia', 1),
  ('school-primal', 'dragon-age-age', 'Primal', 2),
  ('school-espirito', 'dragon-age-age', 'Espírito', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO catalog_arcanas (id, ruleset_id, school_id, name, sort_order) VALUES
  ('arcana-arcana-da-besta', 'dragon-age-age', 'school-criacao', 'Arcana da Besta', 0),
  ('arcana-arcana-da-cura', 'dragon-age-age', 'school-criacao', 'Arcana da Cura', 1),
  ('arcana-arcana-do-heroi', 'dragon-age-age', 'school-criacao', 'Arcana do Herói', 2),
  ('arcana-arcana-da-madeira', 'dragon-age-age', 'school-criacao', 'Arcana da Madeira', 3),
  ('arcana-arcana-da-morte', 'dragon-age-age', 'school-entropia', 'Arcana da Morte', 0),
  ('arcana-arcana-do-destino', 'dragon-age-age', 'school-entropia', 'Arcana do Destino', 1),
  ('arcana-arcana-da-mente', 'dragon-age-age', 'school-entropia', 'Arcana da Mente', 2),
  ('arcana-arcana-da-sombra', 'dragon-age-age', 'school-entropia', 'Arcana da Sombra', 3),
  ('arcana-arcana-do-ar', 'dragon-age-age', 'school-primal', 'Arcana do Ar', 0),
  ('arcana-arcana-do-gelo', 'dragon-age-age', 'school-primal', 'Arcana do Gelo', 1),
  ('arcana-arcana-do-fogo', 'dragon-age-age', 'school-primal', 'Arcana do Fogo', 2),
  ('arcana-arcana-do-raio', 'dragon-age-age', 'school-primal', 'Arcana do Raio', 3),
  ('arcana-arcana-da-agua', 'dragon-age-age', 'school-primal', 'Arcana da Água', 4),
  ('arcana-arcana-da-divinacao', 'dragon-age-age', 'school-espirito', 'Arcana da Divinação', 0),
  ('arcana-arcana-do-encantamento', 'dragon-age-age', 'school-espirito', 'Arcana do Encantamento', 1),
  ('arcana-arcana-da-ilusao', 'dragon-age-age', 'school-espirito', 'Arcana da Ilusão', 2),
  ('arcana-arcana-do-poder', 'dragon-age-age', 'school-espirito', 'Arcana do Poder', 3),
  ('arcana-arcana-da-protecao', 'dragon-age-age', 'school-espirito', 'Arcana da Proteção', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO catalog_weapon_groups (id, ruleset_id, name, sort_order) VALUES
  ('wg-arcos', 'dragon-age-age', 'Arcos', 0),
  ('wg-armas-de-contusao', 'dragon-age-age', 'Armas de Contusão', 1),
  ('wg-armas-de-haste', 'dragon-age-age', 'Armas de Haste', 2),
  ('wg-briga', 'dragon-age-age', 'Briga', 3),
  ('wg-cajados', 'dragon-age-age', 'Cajados', 4),
  ('wg-espadas', 'dragon-age-age', 'Espadas', 5),
  ('wg-laminas-leves', 'dragon-age-age', 'Lâminas Leves', 6),
  ('wg-laminas-pesadas', 'dragon-age-age', 'Lâminas Pesadas', 7),
  ('wg-lancas', 'dragon-age-age', 'Lanças', 8),
  ('wg-lancas-de-cavalaria', 'dragon-age-age', 'Lanças de Cavalaria', 9),
  ('wg-machados', 'dragon-age-age', 'Machados', 10),
  ('wg-estilingues', 'dragon-age-age', 'Estilingues', 11)
ON CONFLICT (id) DO NOTHING;

INSERT INTO catalog_degrees (id, ruleset_id, name, sort_order) VALUES
  ('degree-novato', 'dragon-age-age', 'Novato', 0),
  ('degree-experiente', 'dragon-age-age', 'Experiente', 1),
  ('degree-mestre', 'dragon-age-age', 'Mestre', 2)
ON CONFLICT (id) DO NOTHING;
