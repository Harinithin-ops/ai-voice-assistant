"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { userHistoryService, UserHistoryItem } from "@/lib/user-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Clock, 
  MessageSquare, 
  Terminal, 
  FileText, 
  Upload,
  Trash2,
  BarChart3,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";

const typeIcons = {
  command: Terminal,
  query: Search,
  conversation: MessageSquare,
  file_upload: Upload
};

const typeColors = {
  command: "bg-blue-100 text-blue-800",
  query: "bg-green-100 text-green-800",
  conversation: "bg-purple-100 text-purple-800",
  file_upload: "bg-orange-100 text-orange-800"
};

export function HistoryPanel() {
  const { user } = useAuth();
  const [history, setHistory] = useState<UserHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<UserHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [stats, setStats] = useState<{
    totalItems: number;
    commandCount: number;
    queryCount: number;
    conversationCount: number;
    fileUploadCount: number;
    lastActivity?: Date;
  }>({
    totalItems: 0,
    commandCount: 0,
    queryCount: 0,
    conversationCount: 0,
    fileUploadCount: 0,
    lastActivity: undefined
  });

  useEffect(() => {
    if (user) {
      loadHistory();
      loadStats();
    }
  }, [user]);

  useEffect(() => {
    filterHistory();
  }, [history, searchTerm, selectedType]);

  const loadHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userHistory = await userHistoryService.getUserHistory(user.uid, 100);
      setHistory(userHistory);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    
    try {
      const userStats = await userHistoryService.getHistoryStats(user.uid);
      setStats(userStats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const filterHistory = () => {
    let filtered = history;

    if (selectedType !== "all") {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredHistory(filtered);
  };

  const deleteHistoryItem = async (itemId: string) => {
    try {
      await userHistoryService.deleteHistoryItem(itemId);
      setHistory(prev => prev.filter(item => item.id !== itemId));
      loadStats(); // Refresh stats
    } catch (error) {
      console.error("Failed to delete history item:", error);
    }
  };

  const clearAllHistory = async () => {
    if (!user) return;
    
    try {
      await userHistoryService.clearUserHistory(user.uid);
      setHistory([]);
      setStats({
        totalItems: 0,
        commandCount: 0,
        queryCount: 0,
        conversationCount: 0,
        fileUploadCount: 0,
        lastActivity: undefined
      });
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  const formatTimestamp = (timestamp: Timestamp | Date) => {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    return format(date, "MMM dd, yyyy 'at' HH:mm");
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-gray-500">Please sign in to view your history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Activity Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalItems}</div>
              <div className="text-sm text-gray-500">Total Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.commandCount}</div>
              <div className="text-sm text-gray-500">Commands</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.queryCount}</div>
              <div className="text-sm text-gray-500">Queries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.conversationCount}</div>
              <div className="text-sm text-gray-500">Conversations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.fileUploadCount}</div>
              <div className="text-sm text-gray-500">Files</div>
            </div>
          </div>
          {stats.lastActivity && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Last activity: {format(stats.lastActivity, "MMM dd, yyyy 'at' HH:mm")}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Activity History
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllHistory}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search your history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Tabs value={selectedType} onValueChange={setSelectedType}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="command">Commands</TabsTrigger>
                  <TabsTrigger value="query">Queries</TabsTrigger>
                  <TabsTrigger value="conversation">Chats</TabsTrigger>
                  <TabsTrigger value="file_upload">Files</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <ScrollArea className="h-96">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-gray-500">Loading history...</div>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No history found</p>
                    <p className="text-sm">Start using the voice assistant to see your activity here</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((item) => {
                    const IconComponent = typeIcons[item.type];
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <IconComponent className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={typeColors[item.type]}>
                              {item.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(item.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 truncate">
                            {item.content}
                          </p>
                          {item.metadata && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.metadata.duration && (
                                <span>Duration: {item.metadata.duration}ms • </span>
                              )}
                              {item.metadata.success !== undefined && (
                                <span className={item.metadata.success ? "text-green-600" : "text-red-600"}>
                                  {item.metadata.success ? "Success" : "Failed"}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => item.id && deleteHistoryItem(item.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
