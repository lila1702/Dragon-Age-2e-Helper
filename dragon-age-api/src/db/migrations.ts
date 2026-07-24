export const MIGRATIONS: { id: string; sql: string | string[] }[] = [
    {
        id: "001_characters",
        sql: `
            CREATE TABLE IF NOT EXISTS characters (
                id CHAR(36) NOT NULL PRIMARY KEY,
                sheet_json JSON NOT NULL,
                created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                INDEX idx_characters_updated_at (updated_at)
            )
        `,
    },
    {
        id: "002_relational_schema",
        sql: [
            `
            ALTER TABLE characters
                MODIFY sheet_json JSON NULL,
                ADD COLUMN token_id VARCHAR(128) NULL AFTER id,
                ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT '' AFTER sheet_json,
                ADD COLUMN historico TEXT NULL AFTER name,
                ADD COLUMN class_name VARCHAR(255) NOT NULL DEFAULT '' AFTER historico,
                ADD COLUMN level INT NOT NULL DEFAULT 1 AFTER class_name,
                ADD COLUMN idade VARCHAR(64) NOT NULL DEFAULT '' AFTER level,
                ADD COLUMN sexo VARCHAR(64) NOT NULL DEFAULT '' AFTER idade,
                ADD COLUMN speed INT NOT NULL DEFAULT 10 AFTER sexo,
                ADD COLUMN defense INT NOT NULL DEFAULT 10 AFTER speed,
                ADD COLUMN armor INT NOT NULL DEFAULT 0 AFTER defense,
                ADD COLUMN armor_penalty INT NOT NULL DEFAULT 0 AFTER armor,
                ADD COLUMN hp_current INT NOT NULL DEFAULT 10 AFTER armor_penalty,
                ADD COLUMN hp_max INT NOT NULL DEFAULT 10 AFTER hp_current,
                ADD COLUMN mp_current INT NOT NULL DEFAULT 10 AFTER hp_max,
                ADD COLUMN mp_max INT NOT NULL DEFAULT 10 AFTER mp_current,
                ADD COLUMN weapon_groups TEXT NULL AFTER mp_max,
                ADD COLUMN lut_uses_willpower TINYINT(1) NOT NULL DEFAULT 0 AFTER weapon_groups,
                ADD COLUMN arcane_warrior_option TINYINT(1) NOT NULL DEFAULT 0 AFTER lut_uses_willpower,
                ADD COLUMN currency_copper INT NOT NULL DEFAULT 0 AFTER arcane_warrior_option,
                ADD COLUMN currency_silver INT NOT NULL DEFAULT 0 AFTER currency_copper,
                ADD COLUMN currency_gold INT NOT NULL DEFAULT 0 AFTER currency_silver
            `,
            `
            CREATE TABLE IF NOT EXISTS character_attributes (
                character_id CHAR(36) NOT NULL,
                abbreviation VARCHAR(8) NOT NULL,
                name VARCHAR(64) NOT NULL,
                value INT NOT NULL DEFAULT 0,
                is_primary TINYINT(1) NOT NULL DEFAULT 0,
                focus_bonus INT NOT NULL DEFAULT 0,
                active_focus_name VARCHAR(255) NULL,
                sort_order INT NOT NULL DEFAULT 0,
                PRIMARY KEY (character_id, abbreviation),
                CONSTRAINT fk_character_attributes_character
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
            )
            `,
            `
            CREATE TABLE IF NOT EXISTS character_focuses (
                character_id CHAR(36) NOT NULL,
                attribute_abbreviation VARCHAR(8) NOT NULL,
                focus_name VARCHAR(255) NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                PRIMARY KEY (character_id, attribute_abbreviation, focus_name),
                CONSTRAINT fk_character_focuses_character
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
            )
            `,
            `
            CREATE TABLE IF NOT EXISTS melee_attacks (
                id CHAR(36) NOT NULL PRIMARY KEY,
                character_id CHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL DEFAULT '',
                attribute_abbreviation VARCHAR(8) NOT NULL DEFAULT '',
                damage_attribute_abbreviation VARCHAR(8) NULL,
                weapon_group VARCHAR(128) NULL,
                damage VARCHAR(64) NOT NULL DEFAULT '',
                sort_order INT NOT NULL DEFAULT 0,
                INDEX idx_melee_attacks_character (character_id),
                CONSTRAINT fk_melee_attacks_character
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
            )
            `,
            `
            CREATE TABLE IF NOT EXISTS ranged_attacks (
                id CHAR(36) NOT NULL PRIMARY KEY,
                character_id CHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL DEFAULT '',
                attribute_abbreviation VARCHAR(8) NOT NULL DEFAULT '',
                damage_attribute_abbreviation VARCHAR(8) NULL,
                weapon_group VARCHAR(128) NULL,
                damage VARCHAR(64) NOT NULL DEFAULT '',
                short_range VARCHAR(64) NULL,
                long_range VARCHAR(64) NULL,
                reload VARCHAR(64) NULL,
                sort_order INT NOT NULL DEFAULT 0,
                INDEX idx_ranged_attacks_character (character_id),
                CONSTRAINT fk_ranged_attacks_character
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
            )
            `,
            `
            CREATE TABLE IF NOT EXISTS class_abilities (
                id CHAR(36) NOT NULL PRIMARY KEY,
                character_id CHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL DEFAULT '',
                description TEXT NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                INDEX idx_class_abilities_character (character_id),
                CONSTRAINT fk_class_abilities_character
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
            )
            `,
            `
            CREATE TABLE IF NOT EXISTS talents (
                id CHAR(36) NOT NULL PRIMARY KEY,
                character_id CHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL DEFAULT '',
                benefit_novato TEXT NOT NULL,
                benefit_experiente TEXT NOT NULL,
                benefit_mestre TEXT NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                INDEX idx_talents_character (character_id),
                CONSTRAINT fk_talents_character
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
            )
            `,
            `
            CREATE TABLE IF NOT EXISTS arcana_specializations (
                id CHAR(36) NOT NULL PRIMARY KEY,
                character_id CHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL DEFAULT '',
                benefit_novato TEXT NOT NULL,
                benefit_experiente TEXT NOT NULL,
                benefit_mestre TEXT NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                INDEX idx_arcana_specializations_character (character_id),
                CONSTRAINT fk_arcana_specializations_character
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
            )
            `,
            `
            CREATE TABLE IF NOT EXISTS spells (
                id CHAR(36) NOT NULL PRIMARY KEY,
                character_id CHAR(36) NOT NULL,
                degree ENUM('Novato', 'Experiente', 'Mestre') NOT NULL DEFAULT 'Novato',
                name VARCHAR(255) NOT NULL DEFAULT '',
                school VARCHAR(128) NOT NULL DEFAULT '',
                arcana VARCHAR(128) NOT NULL DEFAULT '',
                cost INT NOT NULL DEFAULT 0,
                spell_time VARCHAR(128) NOT NULL DEFAULT '',
                tn INT NOT NULL DEFAULT 10,
                spell_test VARCHAR(128) NOT NULL DEFAULT '',
                description TEXT NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                INDEX idx_spells_character (character_id),
                CONSTRAINT fk_spells_character
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
            )
            `,
            `
            CREATE TABLE IF NOT EXISTS inventory_items (
                id CHAR(36) NOT NULL PRIMARY KEY,
                character_id CHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL DEFAULT '',
                sale_value VARCHAR(64) NOT NULL DEFAULT '',
                description TEXT NOT NULL,
                quantity INT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                INDEX idx_inventory_items_character (character_id),
                CONSTRAINT fk_inventory_items_character
                    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
            )
            `,
        ],
    },
];
