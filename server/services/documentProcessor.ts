import { invokeLLM } from '../_core/llm';
import { parsePDFWithMinerU, checkMinerUAvailable, shouldUseMinerU } from './mineruService';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

export interface ProcessingResult {
  extractedText?: string;
  summary?: string;
  keywords?: string[];
  category?: string;
  segments?: string[];
  qaPairs?: Array<{ question: string; answer: string }>;
  error?: string;
  method?: string; // 记录使用的解析方法
}

/**
 * 处理PDF文档 - 智能选择最佳解析方案
 */
export async function processPDF(
  fileBuffer: Buffer,
  fileUrl?: string,
  filename?: string
): Promise<ProcessingResult> {
  try {
    const fileSize = fileBuffer.length;
    
    // 策略1: 如果是学术论文或技术文档，优先使用MinerU
    if (filename && fileUrl && shouldUseMinerU(filename, fileSize)) {
      const mineruAvailable = await checkMinerUAvailable();
      
      if (mineruAvailable) {
        console.log(`[MinerU] Detected academic/technical document: ${filename}`);
        
        // 保存到临时文件
        const fs = require('fs');
        const tempPath = `/tmp/pdf_${Date.now()}.pdf`;
        fs.writeFileSync(tempPath, fileBuffer);
        
        try {
          const result = await parsePDFWithMinerU(tempPath, {
            backend: 'pipeline',
            method: 'auto',
            lang: 'ch',
          });
          
          // 清理临时文件
          fs.unlinkSync(tempPath);
          
          if (result.success && result.markdown) {
            console.log(`[MinerU] Success! Processing time: ${result.processingTime}ms`);
            return { 
              extractedText: result.markdown,
              method: 'mineru'
            };
          } else {
            console.warn('[MinerU] Failed, falling back to pdf-parse:', result.error);
          }
        } catch (e) {
          console.warn('[MinerU] Processing error:', e);
          // 清理临时文件
          try { fs.unlinkSync(tempPath); } catch {}
        }
      }
    }
    
    // 策略2: 尝试pdf-parse直接提取文本
    try {
      const data = await pdfParse(fileBuffer);
      const extractedText = data.text;

      if (extractedText && extractedText.trim().length > 100) {
        console.log('[pdf-parse] Successfully extracted text');
        return { 
          extractedText,
          method: 'pdf-parse'
        };
      }
    } catch (e) {
      console.log('[pdf-parse] Failed:', e);
    }

    // 策略3: 如果有URL，使用LLM多模态处理
    if (fileUrl) {
      console.log('[LLM] Using multimodal processing for scanned PDF');
      return await performOCR(fileUrl, 'application/pdf');
    }

    // 如果都失败了
    return {
      error: "PDF可能是扫描件，需要提供文件URL以进行OCR处理",
      method: 'failed'
    };
  } catch (error) {
    console.error("PDF处理失败:", error);
    return {
      error: "PDF处理失败: " + (error as Error).message,
      method: 'error'
    };
  }
}

/**
 * 使用LLM进行OCR识别（处理图片或扫描PDF）
 */
export async function performOCR(fileUrl: string, mimeType: string): Promise<ProcessingResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "请识别并提取图片中的所有文字内容，保持原有格式和结构。" },
          mimeType.startsWith("image/")
            ? {
                type: "image_url" as const,
                image_url: { url: fileUrl },
              }
            : {
                type: "file_url" as const,
                file_url: { url: fileUrl, mime_type: mimeType as any },
              },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const extractedText = typeof content === 'string' ? content : '';
    return { 
      extractedText,
      method: 'llm-ocr'
    };
  } catch (error) {
    console.error("OCR处理失败:", error);
    return {
      error: "OCR处理失败: " + (error as Error).message,
      method: 'error'
    };
  }
}

/**
 * 使用LLM进行ASR转写（音视频转文字）
 */
export async function performASR(fileUrl: string, mimeType: string): Promise<ProcessingResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "请转写音频/视频中的语音内容为文字，保持说话顺序和段落结构。" },
            {
              type: "file_url",
              file_url: {
                url: fileUrl,
                mime_type: mimeType as any,
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const extractedText = typeof content === 'string' ? content : '';
    return { 
      extractedText,
      method: 'llm-asr'
    };
  } catch (error) {
    console.error("ASR处理失败:", error);
    return {
      error: "ASR处理失败: " + (error as Error).message,
      method: 'error'
    };
  }
}

/**
 * 文本智能分段
 */
export async function segmentText(text: string): Promise<ProcessingResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "你是一个文本分段专家。请将输入的文本按照语义和主题进行智能分段，每个段落应该是一个完整的语义单元。",
        },
        {
          role: "user",
          content: `请对以下文本进行智能分段，返回JSON格式：{"segments": ["段落1", "段落2", ...]}\n\n${text}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "text_segmentation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              segments: {
                type: "array",
                items: { type: "string" },
                description: "分段后的文本段落数组",
              },
            },
            required: ["segments"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid response from LLM');
    }

    const result = JSON.parse(content);
    return { 
      segments: result.segments,
      method: 'llm-segment'
    };
  } catch (error) {
    console.error("文本分段失败:", error);
    return {
      error: "文本分段失败: " + (error as Error).message,
      method: 'error'
    };
  }
}

/**
 * 生成文档摘要
 */
export async function generateSummary(text: string): Promise<ProcessingResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "你是一个文档摘要专家。请生成简洁准确的文档摘要，突出核心内容和关键信息。",
        },
        {
          role: "user",
          content: `请为以下文本生成摘要（200字以内），返回JSON格式：{"summary": "摘要内容"}\n\n${text.substring(0, 8000)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "document_summary",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description: "文档摘要",
              },
            },
            required: ["summary"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid response from LLM');
    }

    const result = JSON.parse(content);
    return { 
      summary: result.summary,
      method: 'llm-summary'
    };
  } catch (error) {
    console.error("摘要生成失败:", error);
    return {
      error: "摘要生成失败: " + (error as Error).message,
      method: 'error'
    };
  }
}

/**
 * 提取关键词
 */
export async function extractKeywords(text: string): Promise<ProcessingResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "你是一个关键词提取专家。请从文本中提取最重要的关键词和短语。",
        },
        {
          role: "user",
          content: `请从以下文本中提取5-10个关键词，返回JSON格式：{"keywords": ["关键词1", "关键词2", ...]}\n\n${text.substring(0, 8000)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "keyword_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "提取的关键词列表",
              },
            },
            required: ["keywords"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid response from LLM');
    }

    const result = JSON.parse(content);
    return { 
      keywords: result.keywords,
      method: 'llm-keywords'
    };
  } catch (error) {
    console.error("关键词提取失败:", error);
    return {
      error: "关键词提取失败: " + (error as Error).message,
      method: 'error'
    };
  }
}

/**
 * 生成QA对
 */
export async function generateQAPairs(text: string, count: number = 5): Promise<ProcessingResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "你是一个问答对生成专家。请基于文本内容生成高质量的问答对，问题应该有针对性，答案应该准确完整。",
        },
        {
          role: "user",
          content: `请基于以下文本生成${count}个问答对，返回JSON格式：{"qaPairs": [{"question": "问题", "answer": "答案"}]}\n\n${text.substring(0, 8000)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "qa_generation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              qaPairs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                  },
                  required: ["question", "answer"],
                  additionalProperties: false,
                },
                description: "生成的问答对列表",
              },
            },
            required: ["qaPairs"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid response from LLM');
    }

    const result = JSON.parse(content);
    return { 
      qaPairs: result.qaPairs,
      method: 'llm-qa'
    };
  } catch (error) {
    console.error("QA对生成失败:", error);
    return {
      error: "QA对生成失败: " + (error as Error).message,
      method: 'error'
    };
  }
}

