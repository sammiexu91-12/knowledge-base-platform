import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import { storagePut, storageGet } from "./storage";
import { processDataSource } from "./services/taskProcessor";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 数据源管理
  dataSource: router({
    list: publicProcedure.query(async ({ ctx }) => {
      
      return await db.getDataSources();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getDataSourceById(input.id);
      }),
    
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["document", "image", "video", "audio", "other"]),
        fileUrl: z.string(),
        fileSize: z.string().optional(),
        mimeType: z.string().optional(),
        department: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = nanoid();
        const dataSource = await db.createDataSource({
          id,
          ...input,
          uploadedBy: anonymous,
          status: "pending",
        });
        
        // 异步处理数据源
        processDataSource(id).catch(err => {
          console.error('处理数据源失败:', err);
        });
        
        return dataSource;
      }),
    
    updateStatus: publicProcedure
      .input(z.object({
        id: z.string(),
        status: z.enum(["pending", "processing", "completed", "failed"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateDataSourceStatus(input.id, input.status);
        return { success: true };
      }),
  }),
  
  // 知识片段管理
  knowledge: router({
    list: publicProcedure
      .input(z.object({
        sourceId: z.string().optional(),
        knowledgeType: z.string().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getKnowledgeItems(input);
      }),
    
    create: publicProcedure
      .input(z.object({
        sourceId: z.string(),
        title: z.string(),
        content: z.string(),
        summary: z.string().optional(),
        category: z.string().optional(),
        tags: z.string().optional(),
        knowledgeType: z.enum(["rag", "sft", "pretrain", "multimodal"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = nanoid();
        return await db.createKnowledgeItem({
          id,
          ...input,
          createdBy: anonymous,
          status: "draft",
        });
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
        summary: z.string().optional(),
        category: z.string().optional(),
        tags: z.string().optional(),
        status: z.enum(["draft", "reviewed", "published"]).optional(),
        reviewedBy: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateKnowledgeItem(id, data);
        return { success: true };
      }),
  }),
  
  // QA对管理
  qaPair: router({
    list: publicProcedure
      .input(z.object({ knowledgeId: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getQAPairs(input?.knowledgeId);
      }),
    
    create: publicProcedure
      .input(z.object({
        knowledgeId: z.string(),
        question: z.string(),
        answer: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = nanoid();
        return await db.createQAPair({
          id,
          ...input,
          createdBy: anonymous,
          status: "draft",
        });
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.string(),
        question: z.string().optional(),
        answer: z.string().optional(),
        status: z.enum(["draft", "reviewed", "published"]).optional(),
        reviewedBy: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateQAPair(id, data);
        return { success: true };
      }),
  }),
  
  // 处理任务管理
  task: router({
    list: publicProcedure
      .input(z.object({ sourceId: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getProcessingTasks(input?.sourceId);
      }),
    
    create: publicProcedure
      .input(z.object({
        sourceId: z.string(),
        taskType: z.enum(["ocr", "asr", "extraction", "segmentation", "qa_generation", "summarization"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = nanoid();
        return await db.createProcessingTask({
          id,
          ...input,
          createdBy: anonymous,
          status: "pending",
        });
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.string(),
        status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
        progress: z.string().optional(),
        result: z.string().optional(),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        if (data.status === "completed" || data.status === "failed") {
          (data as any).completedAt = new Date();
        }
        await db.updateProcessingTask(id, data);
        return { success: true };
      }),
  }),
  
  // 文件上传
  upload: router({
    getUploadUrl: publicProcedure
      .input(z.object({
        filename: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const key = `uploads/${Date.now()}-${input.filename}`;
        // 这里返回一个键，前端将直接上传到这个键
        return { key, contentType: input.contentType };
      }),
    
    confirmUpload: publicProcedure
      .input(z.object({
        key: z.string(),
        fileBuffer: z.string(), // base64 encoded
        contentType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBuffer, 'base64');
        const result = await storagePut(input.key, buffer, input.contentType);
        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
