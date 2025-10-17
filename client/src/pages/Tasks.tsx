import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Eye, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEffect } from "react";

export default function Tasks() {
  const { data: tasks = [], isLoading, refetch } = trpc.task.list.useQuery();

  // 自动刷新：每5秒刷新一次任务列表
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetch]);

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-700",
      processing: "bg-blue-100 text-blue-700",
      failed: "bg-red-100 text-red-700",
      pending: "bg-gray-100 text-gray-700",
    };
    const labels = {
      completed: "已完成",
      processing: "处理中",
      failed: "失败",
      pending: "待处理",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getTaskTypeBadge = (type: string) => {
    const labels = {
      ocr: "OCR识别",
      asr: "ASR转写",
      extraction: "信息提取",
      segmentation: "文本分段",
      qa_generation: "QA生成",
      summarization: "摘要生成",
    };
    return (
      <Badge variant="outline">
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("zh-CN");
  };

  const processingCount = tasks.filter(t => t.status === "processing").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">处理任务</h1>
          <p className="text-gray-500 mt-1">
            查看和管理数据处理任务
            {processingCount > 0 && (
              <span className="ml-2 text-blue-600">
                · {processingCount} 个任务正在处理中
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>任务列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无处理任务</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务类型</TableHead>
                  <TableHead>进度</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>完成时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{getTaskTypeBadge(task.taskType)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={parseInt(task.progress || "0")} className="w-24" />
                        <span className="text-xs text-gray-500">{task.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>{formatDate(task.createdAt)}</TableCell>
                    <TableCell>{formatDate(task.completedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {task.status === "failed" && task.errorMessage && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => alert(task.errorMessage)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

