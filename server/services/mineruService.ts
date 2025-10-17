/**
 * MinerU文档解析服务
 * 使用MinerU进行高质量PDF文档解析
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);

export interface MinerUResult {
  success: boolean;
  markdown?: string;
  json?: any;
  error?: string;
  processingTime?: number;
}

/**
 * 使用MinerU解析PDF文档
 */
export async function parsePDFWithMinerU(
  pdfPath: string,
  options: {
    backend?: 'pipeline' | 'vlm-transformers';
    method?: 'auto' | 'txt' | 'ocr';
    lang?: string;
  } = {}
): Promise<MinerUResult> {
  const startTime = Date.now();
  
  try {
    // 创建临时输出目录
    const outputDir = path.join('/tmp', `mineru_${Date.now()}`);
    await mkdir(outputDir, { recursive: true });

    // 构建命令参数
    const args = [
      '-p', pdfPath,
      '-o', outputDir,
      '-b', options.backend || 'pipeline',
    ];

    if (options.method) {
      args.push('-m', options.method);
    }

    if (options.lang) {
      args.push('-l', options.lang);
    }

    // 执行MinerU命令
    const result = await executeMinerU(args);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        processingTime: Date.now() - startTime,
      };
    }

    // 读取输出文件
    const files = await readdir(outputDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    let markdown: string | undefined;
    let jsonData: any | undefined;

    if (mdFiles.length > 0) {
      const mdPath = path.join(outputDir, mdFiles[0]);
      markdown = await readFile(mdPath, 'utf-8');
    }

    if (jsonFiles.length > 0) {
      const jsonPath = path.join(outputDir, jsonFiles[0]);
      const jsonContent = await readFile(jsonPath, 'utf-8');
      try {
        jsonData = JSON.parse(jsonContent);
      } catch (e) {
        console.warn('Failed to parse MinerU JSON output:', e);
      }
    }

    // 清理临时文件
    try {
      await fs.promises.rm(outputDir, { recursive: true, force: true });
    } catch (e) {
      console.warn('Failed to cleanup temp directory:', e);
    }

    return {
      success: true,
      markdown,
      json: jsonData,
      processingTime: Date.now() - startTime,
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * 执行MinerU命令
 */
function executeMinerU(args: string[]): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const process = spawn('mineru', args);
    
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // 设置超时（5分钟）
    const timeout = setTimeout(() => {
      process.kill();
      resolve({
        success: false,
        error: 'MinerU processing timeout (5 minutes)',
      });
    }, 5 * 60 * 1000);

    process.on('close', (code) => {
      clearTimeout(timeout);
      
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          error: `MinerU exited with code ${code}: ${stderr || stdout}`,
        });
      }
    });

    process.on('error', (error) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        error: `Failed to start MinerU: ${error.message}`,
      });
    });
  });
}

/**
 * 检查MinerU是否可用
 */
export async function checkMinerUAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const process = spawn('mineru', ['--version']);
    
    process.on('close', (code) => {
      resolve(code === 0);
    });

    process.on('error', () => {
      resolve(false);
    });

    // 超时检查
    setTimeout(() => {
      process.kill();
      resolve(false);
    }, 5000);
  });
}

/**
 * 判断文档是否适合使用MinerU处理
 */
export function shouldUseMinerU(filename: string, fileSize: number): boolean {
  const ext = path.extname(filename).toLowerCase();
  
  // 只处理PDF
  if (ext !== '.pdf') {
    return false;
  }

  // 文件太大不使用MinerU（超过50MB）
  if (fileSize > 50 * 1024 * 1024) {
    return false;
  }

  // 检查文件名特征，判断是否为学术论文或技术文档
  const academicKeywords = [
    'paper', 'thesis', 'research', 'journal', 'conference',
    '论文', '研究', '学术', '期刊', '会议',
    'arxiv', 'ieee', 'acm', 'springer',
  ];

  const technicalKeywords = [
    'manual', 'guide', 'documentation', 'spec', 'technical',
    '手册', '指南', '文档', '规范', '技术',
  ];

  const lowerFilename = filename.toLowerCase();
  
  const isAcademic = academicKeywords.some(kw => lowerFilename.includes(kw));
  const isTechnical = technicalKeywords.some(kw => lowerFilename.includes(kw));

  return isAcademic || isTechnical;
}

