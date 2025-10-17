import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Database, FileText, MessageSquare, CheckSquare, TrendingUp, Clock } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const { data: dataSources = [] } = trpc.dataSource.list.useQuery();
  const { data: knowledgeItems = [] } = trpc.knowledge.list.useQuery();
  const { data: qaPairs = [] } = trpc.qaPair.list.useQuery();
  const { data: tasks = [] } = trpc.task.list.useQuery();

  const stats = [
    {
      title: "数据源",
      value: dataSources.length,
      icon: Database,
      description: "已上传的文件数量",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "知识片段",
      value: knowledgeItems.length,
      icon: FileText,
      description: "已处理的知识条目",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "QA对",
      value: qaPairs.length,
      icon: MessageSquare,
      description: "问答对数量",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "处理任务",
      value: tasks.length,
      icon: CheckSquare,
      description: "总任务数",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const recentDataSources = dataSources.slice(0, 5);
  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">概览</h1>
        <p className="text-gray-500 mt-1">欢迎回来，{user?.name || '用户'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Data Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              最近上传
            </CardTitle>
            <CardDescription>最近上传的数据源</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDataSources.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">暂无数据</p>
            ) : (
              <div className="space-y-3">
                {recentDataSources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{source.name}</p>
                      <p className="text-xs text-gray-500">{source.type}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      source.status === 'completed' ? 'bg-green-100 text-green-700' :
                      source.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      source.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {source.status === 'completed' ? '已完成' :
                       source.status === 'processing' ? '处理中' :
                       source.status === 'failed' ? '失败' : '待处理'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              最近任务
            </CardTitle>
            <CardDescription>最近的处理任务</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">暂无任务</p>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.taskType === 'ocr' ? 'OCR识别' :
                         task.taskType === 'asr' ? 'ASR转写' :
                         task.taskType === 'extraction' ? '信息提取' :
                         task.taskType === 'segmentation' ? '文本分段' :
                         task.taskType === 'qa_generation' ? 'QA生成' :
                         task.taskType === 'summarization' ? '摘要生成' : task.taskType}
                      </p>
                      <p className="text-xs text-gray-500">进度: {task.progress}%</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      task.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status === 'completed' ? '已完成' :
                       task.status === 'processing' ? '处理中' :
                       task.status === 'failed' ? '失败' : '待处理'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

