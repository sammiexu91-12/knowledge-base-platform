import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Upload as UploadIcon, FileText, Image, Video, Music, File, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [department, setDepartment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const utils = trpc.useUtils();
  const createDataSource = trpc.dataSource.create.useMutation({
    onSuccess: () => {
      toast.success("文件上传成功！系统正在后台处理...");
      setFile(null);
      setDepartment("");
      setUploadSuccess(true);
      utils.dataSource.list.invalidate();
      
      // 3秒后重置成功状态
      setTimeout(() => setUploadSuccess(false), 3000);
    },
    onError: (error) => {
      toast.error("上传失败：" + error.message);
    },
  });

  const confirmUpload = trpc.upload.confirmUpload.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadSuccess(false);
    }
  };

  const getFileType = (mimeType: string): "document" | "image" | "video" | "audio" | "other" => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("word") ||
      mimeType.includes("document") ||
      mimeType.includes("text")
    ) {
      return "document";
    }
    return "other";
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("请选择文件");
      return;
    }

    setUploading(true);
    try {
      // 读取文件为base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(",")[1]; // 移除data:xxx;base64,前缀

        // 上传到S3
        const uploadResult = await confirmUpload.mutateAsync({
          key: `uploads/${Date.now()}-${file.name}`,
          fileBuffer: base64Data,
          contentType: file.type,
        });

        // 创建数据源记录
        await createDataSource.mutateAsync({
          name: file.name,
          type: getFileType(file.type),
          fileUrl: uploadResult.url,
          fileSize: file.size.toString(),
          mimeType: file.type,
          department: department || undefined,
        });

        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploading(false);
      toast.error("上传失败");
    }
  };

  const getFileIcon = () => {
    if (!file) return <File className="h-12 w-12 text-gray-400" />;
    const type = getFileType(file.type);
    switch (type) {
      case "document":
        return <FileText className="h-12 w-12 text-blue-500" />;
      case "image":
        return <Image className="h-12 w-12 text-green-500" />;
      case "video":
        return <Video className="h-12 w-12 text-purple-500" />;
      case "audio":
        return <Music className="h-12 w-12 text-orange-500" />;
      default:
        return <File className="h-12 w-12 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">数据接入</h1>
        <p className="text-gray-500 mt-1">上传文件到知识库系统</p>
      </div>

      {uploadSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            文件上传成功！系统正在后台进行以下处理：
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>文本提取/OCR识别/ASR转写</li>
              <li>智能分段</li>
              <li>生成摘要和关键词</li>
              <li>自动生成QA对</li>
            </ul>
            您可以在"处理任务"页面查看进度，在"知识库"和"QA对管理"页面查看结果。
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>上传文件</CardTitle>
          <CardDescription>支持 PDF, Word, Excel, 图片, 视频等多种格式</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.wav"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                {file ? (
                  <>
                    {getFileIcon()}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-12 w-12 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">点击上传文件</p>
                      <p className="text-xs text-gray-500">或拖拽文件到此处</p>
                    </div>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Department Input */}
          <div className="space-y-2">
            <Label htmlFor="department">部门（可选）</Label>
            <Input
              id="department"
              placeholder="输入部门名称"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? "上传中..." : "开始上传"}
          </Button>
        </CardContent>
      </Card>

      {/* Processing Info */}
      <Card>
        <CardHeader>
          <CardTitle>自动处理流程</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">文本提取</p>
                <p className="text-sm text-gray-500">
                  PDF/Word文档直接提取文本；图片使用OCR识别；音视频使用ASR转写
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">智能分段</p>
                <p className="text-sm text-gray-500">
                  按照语义和主题将长文本分割成多个知识片段
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">生成摘要和关键词</p>
                <p className="text-sm text-gray-500">
                  自动提取核心内容、关键词和文本分类
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium">生成QA对</p>
                <p className="text-sm text-gray-500">
                  基于文本内容自动生成高质量的问答对，用于RAG或SFT训练
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supported Formats */}
      <Card>
        <CardHeader>
          <CardTitle>支持的文件格式</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-sm">PDF, Word, Excel</span>
            </div>
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-green-500" />
              <span className="text-sm">JPG, PNG, GIF</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-500" />
              <span className="text-sm">MP4, AVI</span>
            </div>
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-orange-500" />
              <span className="text-sm">MP3, WAV</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

