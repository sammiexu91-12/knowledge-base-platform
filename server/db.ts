import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  dataSources,
  knowledgeItems,
  qaPairs,
  processingTasks,
  InsertDataSource,
  InsertKnowledgeItem,
  InsertQAPair,
  InsertProcessingTask,
  DataSource,
  KnowledgeItem,
  QAPair,
  ProcessingTask
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// DataSource queries
export async function createDataSource(data: InsertDataSource): Promise<DataSource> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(dataSources).values(data);
  const result = await db.select().from(dataSources).where(eq(dataSources.id, data.id!)).limit(1);
  return result[0];
}

export async function getDataSources(userId?: string): Promise<DataSource[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (userId) {
    return await db.select().from(dataSources).where(eq(dataSources.uploadedBy, userId)).orderBy(desc(dataSources.createdAt));
  }
  return await db.select().from(dataSources).orderBy(desc(dataSources.createdAt));
}

export async function getDataSourceById(id: string): Promise<DataSource | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(dataSources).where(eq(dataSources.id, id)).limit(1);
  return result[0];
}

export async function updateDataSourceStatus(id: string, status: "pending" | "processing" | "completed" | "failed"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(dataSources).set({ status, updatedAt: new Date() }).where(eq(dataSources.id, id));
}

// KnowledgeItem queries
export async function createKnowledgeItem(data: InsertKnowledgeItem): Promise<KnowledgeItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(knowledgeItems).values(data);
  const result = await db.select().from(knowledgeItems).where(eq(knowledgeItems.id, data.id!)).limit(1);
  return result[0];
}

export async function getKnowledgeItems(filters?: { sourceId?: string; knowledgeType?: string; status?: string }): Promise<KnowledgeItem[]> {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(knowledgeItems);
  
  const conditions = [];
  if (filters?.sourceId) conditions.push(eq(knowledgeItems.sourceId, filters.sourceId));
  if (filters?.knowledgeType) conditions.push(eq(knowledgeItems.knowledgeType, filters.knowledgeType as any));
  if (filters?.status) conditions.push(eq(knowledgeItems.status, filters.status as any));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return await query.orderBy(desc(knowledgeItems.createdAt));
}

export async function updateKnowledgeItem(id: string, data: Partial<InsertKnowledgeItem>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(knowledgeItems).set({ ...data, updatedAt: new Date() }).where(eq(knowledgeItems.id, id));
}

// QAPair queries
export async function createQAPair(data: InsertQAPair): Promise<QAPair> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(qaPairs).values(data);
  const result = await db.select().from(qaPairs).where(eq(qaPairs.id, data.id!)).limit(1);
  return result[0];
}

export async function getQAPairs(knowledgeId?: string): Promise<QAPair[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (knowledgeId) {
    return await db.select().from(qaPairs).where(eq(qaPairs.knowledgeId, knowledgeId)).orderBy(desc(qaPairs.createdAt));
  }
  return await db.select().from(qaPairs).orderBy(desc(qaPairs.createdAt));
}

export async function updateQAPair(id: string, data: Partial<InsertQAPair>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(qaPairs).set({ ...data, updatedAt: new Date() }).where(eq(qaPairs.id, id));
}

// ProcessingTask queries
export async function createProcessingTask(data: InsertProcessingTask): Promise<ProcessingTask> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(processingTasks).values(data);
  const result = await db.select().from(processingTasks).where(eq(processingTasks.id, data.id!)).limit(1);
  return result[0];
}

export async function getProcessingTasks(sourceId?: string): Promise<ProcessingTask[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (sourceId) {
    return await db.select().from(processingTasks).where(eq(processingTasks.sourceId, sourceId)).orderBy(desc(processingTasks.createdAt));
  }
  return await db.select().from(processingTasks).orderBy(desc(processingTasks.createdAt));
}

export async function updateProcessingTask(id: string, data: Partial<InsertProcessingTask>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(processingTasks).set(data).where(eq(processingTasks.id, id));
}

