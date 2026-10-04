import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const puzzles = sqliteTable(
  "puzzles",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    manageTokenHash: text("manage_token_hash").notNull(),
    status: text("status").notNull().default("published"),
    playCount: integer("play_count").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_puzzles_slug").on(table.slug),
    index("idx_puzzles_status_created").on(table.status, table.createdAt),
  ],
);

export const puzzleGroups = sqliteTable(
  "puzzle_groups",
  {
    id: text("id").primaryKey(),
    puzzleId: text("puzzle_id")
      .notNull()
      .references(() => puzzles.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    position: integer("position").notNull(),
  },
  (table) => [index("idx_puzzle_groups_puzzle").on(table.puzzleId, table.position)],
);

export const groupMembers = sqliteTable(
  "group_members",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id")
      .notNull()
      .references(() => puzzleGroups.id, { onDelete: "cascade" }),
    characterId: integer("character_id").notNull(),
    position: integer("position").notNull(),
  },
  (table) => [index("idx_group_members_group").on(table.groupId, table.position)],
);

export const plays = sqliteTable(
  "plays",
  {
    id: text("id").primaryKey(),
    puzzleId: text("puzzle_id")
      .notNull()
      .references(() => puzzles.id, { onDelete: "cascade" }),
    mistakes: integer("mistakes").notNull(),
    completed: integer("completed", { mode: "boolean" }).notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("idx_plays_puzzle").on(table.puzzleId, table.createdAt)],
);
