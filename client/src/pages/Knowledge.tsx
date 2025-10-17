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
import { Eye, Edit } from "lucide-react";

export default function Knowledge() {
  const { data: knowledgeItems = [], isLoading } = trpc.knowledge.list.useQuery();

  const getStatusBadge = (status: string) => {
    const styles = {
      published: "bg-green-100 text-green-700",
      reviewed: "bg-blue-100 text-blue-700",
      draft: "bg-gray-100 text-gray-700",
    };
    const labels = {
      published: "已发布",
      reviewed: "已审核",
      draft: "草稿",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getKnowledgeTypeBadge = (type: string) => {
    const styles = {
      rag: "bg-purple-100 text-purple-700",
      sft: "bg-orange-100 text-orange-700",
      pretrain: "bg-blue-100 text-blue-700",
      multimodal: "bg-pink-100 text-pink-700",
    };
    const labels = {
      rag: "RAG",
      sft: "SFT",
      pretrain: "Pre-train",
      multimodal: "多模态",
    };
    return (
      <Badge variant="outline" className={styles[type as keyof typeof styles]}>
        {labels[type as keyof typeof labels]}
      </Badge>
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("zh-CN");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">知识库管理</h1>
          <p className="text-gray-500 mt-1">查看和管理知识片段</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>知识片段列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : knowledgeItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无知识片段</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {knowledgeItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        {item.summary && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {item.summary}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getKnowledgeTypeBadge(item.knowledgeType)}</TableCell>
                    <TableCell>{item.category || "-"}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
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

