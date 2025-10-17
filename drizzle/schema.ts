import { mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 数据源表 - 记录上传的原始文件
export const dataSources = mysqlTable("dataSources", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  type: mysqlEnum("type", ["document", "image", "video", "audio", "other"]).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: varchar("fileSize", { length: 64 }),
  mimeType: varchar("mimeType", { length: 128 }),
  uploadedBy: varchar("uploadedBy", { length: 64 }).notNull(),
  department: varchar("department", { length: 128 }),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = typeof dataSources.$inferInsert;

// 知识片段表 - 存储处理后的知识
export const knowledgeItems = mysqlTable("knowledgeItems", {
  id: varchar("id", { length: 64 }).primaryKey(),
  sourceId: varchar("sourceId", { length: 64 }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  category: varchar("category", { length: 128 }),
  tags: text("tags"), // JSON array of tags
  knowledgeType: mysqlEnum("knowledgeType", ["rag", "sft", "pretrain", "multimodal"]).notNull(),
  status: mysqlEnum("status", ["draft", "reviewed", "published"]).default("draft").notNull(),
  createdBy: varchar("createdBy", { length: 64 }).notNull(),
  reviewedBy: varchar("reviewedBy", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type KnowledgeItem = typeof knowledgeItems.$inferSelect;
export type InsertKnowledgeItem = typeof knowledgeItems.$inferInsert;

// QA对表 - 存储问答对
export const qaPairs = mysqlTable("qaPairs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  knowledgeId: varchar("knowledgeId", { length: 64 }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  status: mysqlEnum("status", ["draft", "reviewed", "published"]).default("draft").notNull(),
  createdBy: varchar("createdBy", { length: 64 }).notNull(),
  reviewedBy: varchar("reviewedBy", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type QAPair = typeof qaPairs.$inferSelect;
export type InsertQAPair = typeof qaPairs.$inferInsert;

// 处理任务表 - 记录数据处理任务
export const processingTasks = mysqlTable("processingTasks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  sourceId: varchar("sourceId", { length: 64 }).notNull(),
  taskType: mysqlEnum("taskType", ["ocr", "asr", "extraction", "segmentation", "qa_generation", "summarization"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  progress: varchar("progress", { length: 10 }).default("0"),
  result: text("result"), // JSON result
  errorMessage: text("errorMessage"),
  createdBy: varchar("createdBy", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  completedAt: timestamp("completedAt"),
});

export type ProcessingTask = typeof processingTasks.$inferSelect;
export type InsertProcessingTask = typeof processingTasks.$inferInsert;
