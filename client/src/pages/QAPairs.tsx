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
import { trpc } from "@/lib/trpc";
import { Eye, Edit } from "lucide-react";

export default function QAPairs() {
  const { data: qaPairs = [], isLoading } = trpc.qaPair.list.useQuery();

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

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("zh-CN");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QA对管理</h1>
          <p className="text-gray-500 mt-1">查看和管理问答对</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>QA对列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : qaPairs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无QA对</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">问题</TableHead>
                  <TableHead className="w-[40%]">答案</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qaPairs.map((pair) => (
                  <TableRow key={pair.id}>
                    <TableCell>
                      <p className="line-clamp-2">{pair.question}</p>
                    </TableCell>
                    <TableCell>
                      <p className="line-clamp-2">{pair.answer}</p>
                    </TableCell>
                    <TableCell>{getStatusBadge(pair.status)}</TableCell>
                    <TableCell>{formatDate(pair.createdAt)}</TableCell>
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

