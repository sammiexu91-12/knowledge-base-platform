const { invokeLLM } = require('./server/_core/llm');

const pdfUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663127130904/RQRoFxiwNXhFaoDH.pdf";

async function test() {
  try {
    console.log("\n📄 测试1: 提取PDF文档内容");
    console.log("=".repeat(80));
    
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "请提取这个PDF文档的主要内容，包括：1) 文章标题 2) 作者 3) 主要内容摘要（200字以内）4) 核心观点（3-5条）" },
            {
              type: "file_url",
              file_url: {
                url: pdfUrl,
                mime_type: "application/pdf"
              }
            }
          ]
        }
      ]
    });
    
    const content = response.choices[0]?.message?.content;
    console.log("\n✅ 提取结果:");
    console.log(content);
    console.log("\n" + "=".repeat(80));
    
    // 测试2: 生成QA对
    console.log("\n📝 测试2: 生成QA对");
    console.log("=".repeat(80));
    
    const qaResponse = await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "基于这个PDF文档，生成3个高质量的问答对，返回JSON格式：{\"qaPairs\": [{\"question\": \"...\", \"answer\": \"...\"}]}" },
            {
              type: "file_url",
              file_url: {
                url: pdfUrl,
                mime_type: "application/pdf"
              }
            }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "qa_pairs",
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
                    answer: { type: "string" }
                  },
                  required: ["question", "answer"],
                  additionalProperties: false
                }
              }
            },
            required: ["qaPairs"],
            additionalProperties: false
          }
        }
      }
    });
    
    const qaContent = qaResponse.choices[0]?.message?.content;
    console.log("\n✅ QA对生成结果:");
    console.log(qaContent);
    const qaPairs = JSON.parse(qaContent);
    console.log("\n解析后的QA对数量:", qaPairs.qaPairs.length);
    
  } catch (error) {
    console.error("❌ 错误:", error.message);
    console.error(error.stack);
  }
}

test();
