// 测试PDF处理完整流程
import { processPDF, performOCR, generateSummary, generateQAPairs, segmentText, extractKeywords } from './server/services/documentProcessor.ts';
import fs from 'fs';

const pdfUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663127130904/RQRoFxiwNXhFaoDH.pdf";
const pdfPath = "/home/ubuntu/upload/2015对景德镇御窑旧址考古遗存之审视-王光尧.pdf";

async function test() {
  console.log("=".repeat(80));
  console.log("📄 测试完整PDF处理流程");
  console.log("=".repeat(80));
  
  try {
    // 读取PDF文件
    const buffer = fs.readFileSync(pdfPath);
    const filename = "2015对景德镇御窑旧址考古遗存之审视-王光尧.pdf";
    
    console.log(`\n文件信息:`);
    console.log(`- 文件名: ${filename}`);
    console.log(`- 大小: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- URL: ${pdfUrl}`);
    
    // 步骤1: PDF文本提取
    console.log("\n" + "=".repeat(80));
    console.log("步骤1: PDF文本提取");
    console.log("=".repeat(80));
    
    const extractResult = await processPDF(buffer, pdfUrl, filename);
    
    if (extractResult.error) {
      console.log(`❌ 提取失败: ${extractResult.error}`);
      console.log(`使用的方法: ${extractResult.method}`);
      
      // 尝试OCR
      console.log("\n尝试使用LLM OCR...");
      const ocrResult = await performOCR(pdfUrl, "application/pdf");
      
      if (ocrResult.error) {
        console.log(`❌ OCR失败: ${ocrResult.error}`);
        return;
      }
      
      extractResult.extractedText = ocrResult.extractedText;
      extractResult.method = ocrResult.method;
    }
    
    console.log(`✅ 文本提取成功`);
    console.log(`使用的方法: ${extractResult.method}`);
    console.log(`提取文本长度: ${extractResult.extractedText?.length || 0} 字符`);
    console.log(`\n文本预览（前500字）:\n${extractResult.extractedText?.substring(0, 500)}...`);
    
    const extractedText = extractResult.extractedText || "";
    
    if (!extractedText || extractedText.length < 100) {
      console.log("\n❌ 提取的文本太短，无法继续处理");
      return;
    }
    
    // 步骤2: 生成摘要
    console.log("\n" + "=".repeat(80));
    console.log("步骤2: 生成文档摘要");
    console.log("=".repeat(80));
    
    const summaryResult = await generateSummary(extractedText);
    
    if (summaryResult.error) {
      console.log(`❌ 摘要生成失败: ${summaryResult.error}`);
    } else {
      console.log(`✅ 摘要生成成功`);
      console.log(`\n摘要内容:\n${summaryResult.summary}`);
    }
    
    // 步骤3: 提取关键词
    console.log("\n" + "=".repeat(80));
    console.log("步骤3: 提取关键词");
    console.log("=".repeat(80));
    
    const keywordsResult = await extractKeywords(extractedText);
    
    if (keywordsResult.error) {
      console.log(`❌ 关键词提取失败: ${keywordsResult.error}`);
    } else {
      console.log(`✅ 关键词提取成功`);
      console.log(`\n关键词: ${keywordsResult.keywords?.join(", ")}`);
    }
    
    // 步骤4: 智能分段
    console.log("\n" + "=".repeat(80));
    console.log("步骤4: 智能分段");
    console.log("=".repeat(80));
    
    const segmentResult = await segmentText(extractedText.substring(0, 3000)); // 只处理前3000字
    
    if (segmentResult.error) {
      console.log(`❌ 分段失败: ${segmentResult.error}`);
    } else {
      console.log(`✅ 分段成功`);
      console.log(`段落数量: ${segmentResult.segments?.length || 0}`);
      console.log(`\n各段落长度: ${segmentResult.segments?.map(s => s.length).join(", ")}`);
    }
    
    // 步骤5: 生成QA对
    console.log("\n" + "=".repeat(80));
    console.log("步骤5: 生成QA对");
    console.log("=".repeat(80));
    
    const qaResult = await generateQAPairs(extractedText, 3);
    
    if (qaResult.error) {
      console.log(`❌ QA对生成失败: ${qaResult.error}`);
    } else {
      console.log(`✅ QA对生成成功`);
      console.log(`QA对数量: ${qaResult.qaPairs?.length || 0}`);
      
      qaResult.qaPairs?.forEach((qa, index) => {
        console.log(`\nQA ${index + 1}:`);
        console.log(`Q: ${qa.question}`);
        console.log(`A: ${qa.answer}`);
      });
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("✅ 测试完成！");
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("\n❌ 测试过程中发生错误:", error);
    console.error(error.stack);
  }
}

test();

