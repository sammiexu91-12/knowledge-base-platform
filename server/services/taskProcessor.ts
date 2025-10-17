import {
  createKnowledgeItem,
  createQAPair,
  createProcessingTask,
  getDataSourceById,
  updateDataSourceStatus,
  updateProcessingTask,
} from "../db";
import {
  generateQAPairs,
  generateSummary,
  performASR,
  performOCR,
  processPDF,
  segmentText,
} from "./documentProcessor";

/**
 * 处理数据源文件
 */
export async function processDataSource(dataSourceId: string) {
  try {
    // 获取数据源信息
    const dataSource = await getDataSourceById(dataSourceId);
    if (!dataSource) {
      throw new Error("数据源不存在");
    }

    // 更新状态为处理中
    await updateDataSourceStatus(dataSourceId, "processing");

    let extractedText = "";

    // 根据文件类型选择处理方式
    if (dataSource.type === "document") {
      // 处理文档类型
      if (dataSource.mimeType?.includes("pdf")) {
        // 创建文本提取任务
        const extractTask = await createProcessingTask({
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sourceId: dataSourceId,
          taskType: "extraction",
          status: "processing",
          progress: "0",
          createdBy: dataSource.uploadedBy,
        });

        // 下载PDF文件并处理
        const response = await fetch(dataSource.fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // 尝试提取PDF文本（传递文件名和URL以便MinerU判断）
        const result = await processPDF(buffer, dataSource.fileUrl, dataSource.name);
        if (result.error) {
          // 如果是扫描件，使用OCR
          await updateProcessingTask(extractTask.id, { status: "failed" });
          const ocrTask = await createProcessingTask({
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sourceId: dataSourceId,
            taskType: "ocr",
            status: "processing",
            progress: "0",
            createdBy: dataSource.uploadedBy,
          });

          const ocrResult = await performOCR(dataSource.fileUrl, dataSource.mimeType || "");
          extractedText = ocrResult.extractedText || "";
          console.log(`[Processing] Used method: ${ocrResult.method}`);
          await updateProcessingTask(ocrTask.id, { progress: "100" });
          await updateProcessingTask(ocrTask.id, { status: "completed" });
        } else {
          extractedText = result.extractedText || "";
          console.log(`[Processing] Used method: ${result.method}`);
          await updateProcessingTask(extractTask.id, { progress: "100" });
          await updateProcessingTask(extractTask.id, { status: "completed" });
        }
      }
    } else if (dataSource.type === "image") {
      // 图片OCR
      const ocrTask = await createProcessingTask({
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceId: dataSourceId,
        taskType: "ocr",
        status: "processing",
        progress: "0",
        createdBy: dataSource.uploadedBy,
      });

      const result = await performOCR(dataSource.fileUrl, dataSource.mimeType || "");
      extractedText = result.extractedText || "";
      await updateProcessingTask(ocrTask.id, { progress: "100" });
      await updateProcessingTask(ocrTask.id, { status: "completed" });
    } else if (dataSource.type === "video" || dataSource.type === "audio") {
      // 音视频ASR
      const asrTask = await createProcessingTask({
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceId: dataSourceId,
        taskType: "asr",
        status: "processing",
        progress: "0",
        createdBy: dataSource.uploadedBy,
      });

      const result = await performASR(dataSource.fileUrl, dataSource.mimeType || "");
      extractedText = result.extractedText || "";
      await updateProcessingTask(asrTask.id, { progress: "100" });
      await updateProcessingTask(asrTask.id, { status: "completed" });
    }

    if (!extractedText) {
      await updateDataSourceStatus(dataSourceId, "failed");
      return;
    }

    // 生成摘要和关键词
    const summaryTask = await createProcessingTask({
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceId: dataSourceId,
      taskType: "summarization",
      status: "processing",
      progress: "0",
      createdBy: dataSource.uploadedBy,
    });

    const summaryResult = await generateSummary(extractedText);
    await updateProcessingTask(summaryTask.id, { progress: "100" });
    await updateProcessingTask(summaryTask.id, { status: "completed" });

    // 文本分段
    const segmentTask = await createProcessingTask({
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceId: dataSourceId,
      taskType: "segmentation",
      status: "processing",
      progress: "0",
      createdBy: dataSource.uploadedBy,
    });

    const segmentResult = await segmentText(extractedText);
    await updateProcessingTask(segmentTask.id, { progress: "100" });
    await updateProcessingTask(segmentTask.id, { status: "completed" });

    // 为每个段落创建知识条目
    const segments = segmentResult.segments || [extractedText];
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      await createKnowledgeItem({
        id: `knowledge_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        sourceId: dataSourceId,
        createdBy: dataSource.uploadedBy,
        title: `${dataSource.name} - 片段 ${i + 1}`,
        content: segment,
        summary: i === 0 ? summaryResult.summary : undefined,
        tags: i === 0 ? JSON.stringify(summaryResult.keywords || []) : undefined,
        category: summaryResult.category,
        knowledgeType: "rag",
        status: "draft",
      });
    }

    // 生成QA对
    const qaTask = await createProcessingTask({
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceId: dataSourceId,
      taskType: "qa_generation",
      status: "processing",
      progress: "0",
      createdBy: dataSource.uploadedBy,
    });

    const qaResult = await generateQAPairs(extractedText);
    const qaPairs = qaResult.qaPairs || [];

    for (const pair of qaPairs) {
      await createQAPair({
        id: `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        knowledgeId: dataSourceId,
        createdBy: dataSource.uploadedBy,
        question: pair.question,
        answer: pair.answer,
        status: "draft",
      });
    }

    await updateProcessingTask(qaTask.id, { progress: "100" });
    await updateProcessingTask(qaTask.id, { status: "completed" });

    // 更新数据源状态为完成
    await updateDataSourceStatus(dataSourceId, "completed");
  } catch (error) {
    console.error("处理数据源失败:", error);
    await updateDataSourceStatus(dataSourceId, "failed");
    throw error;
  }
}

