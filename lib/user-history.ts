import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { getFirebaseFirestore } from "./firebase";

export interface UserHistoryItem {
  id?: string;
  userId: string;
  type: 'command' | 'query' | 'conversation' | 'file_upload';
  content: string;
  metadata?: {
    duration?: number;
    success?: boolean;
    error?: string;
    fileType?: string;
    responseLength?: number;
  };
  timestamp: Timestamp | Date;
  createdAt?: Timestamp;
}

export interface UserSession {
  id?: string;
  userId: string;
  startTime: Timestamp | Date;
  endTime?: Timestamp | Date;
  duration?: number;
  activityCount: number;
  lastActivity: Timestamp | Date;
}

class UserHistoryService {
  private db = getFirebaseFirestore();
  private historyCollection = "user_history";
  private sessionsCollection = "user_sessions";

  // Add a new history item
  async addHistoryItem(item: Omit<UserHistoryItem, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, this.historyCollection), {
        ...item,
        createdAt: serverTimestamp(),
        timestamp: item.timestamp || serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding history item:", error);
      throw error;
    }
  }

  // Get user history with pagination
  async getUserHistory(
    userId: string, 
    limitCount: number = 50,
    type?: UserHistoryItem['type']
  ): Promise<UserHistoryItem[]> {
    try {
      let q = query(
        collection(this.db, this.historyCollection),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );

      if (type) {
        q = query(
          collection(this.db, this.historyCollection),
          where("userId", "==", userId),
          where("type", "==", type),
          orderBy("timestamp", "desc"),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserHistoryItem));
    } catch (error) {
      console.error("Error fetching user history:", error);
      throw error;
    }
  }

  // Get history statistics
  async getHistoryStats(userId: string): Promise<{
    totalItems: number;
    commandCount: number;
    queryCount: number;
    conversationCount: number;
    fileUploadCount: number;
    lastActivity?: Date;
  }> {
    try {
      const history = await this.getUserHistory(userId, 1000); // Get more items for stats
      
      const stats = {
        totalItems: history.length,
        commandCount: history.filter(item => item.type === 'command').length,
        queryCount: history.filter(item => item.type === 'query').length,
        conversationCount: history.filter(item => item.type === 'conversation').length,
        fileUploadCount: history.filter(item => item.type === 'file_upload').length,
        lastActivity: history.length > 0 ? (history[0].timestamp as Timestamp).toDate() : undefined
      };

      return stats;
    } catch (error) {
      console.error("Error fetching history stats:", error);
      throw error;
    }
  }

  // Start a new user session
  async startSession(userId: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, this.sessionsCollection), {
        userId,
        startTime: serverTimestamp(),
        activityCount: 0,
        lastActivity: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error starting session:", error);
      throw error;
    }
  }

  // Update session activity
  async updateSession(sessionId: string, activityCount: number): Promise<void> {
    try {
      const sessionRef = doc(this.db, this.sessionsCollection, sessionId);
      await updateDoc(sessionRef, {
        activityCount,
        lastActivity: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating session:", error);
      throw error;
    }
  }

  // End a user session
  async endSession(sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(this.db, this.sessionsCollection, sessionId);
      await updateDoc(sessionRef, {
        endTime: serverTimestamp()
      });
    } catch (error) {
      console.error("Error ending session:", error);
      throw error;
    }
  }

  // Delete a history item
  async deleteHistoryItem(itemId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, this.historyCollection, itemId));
    } catch (error) {
      console.error("Error deleting history item:", error);
      throw error;
    }
  }

  // Clear all user history
  async clearUserHistory(userId: string): Promise<void> {
    try {
      const history = await this.getUserHistory(userId, 1000);
      const deletePromises = history.map(item => 
        item.id ? this.deleteHistoryItem(item.id) : Promise.resolve()
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error clearing user history:", error);
      throw error;
    }
  }

  // Search history by content
  async searchHistory(userId: string, searchTerm: string): Promise<UserHistoryItem[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation - for production, consider using Algolia or similar
      const history = await this.getUserHistory(userId, 500);
      return history.filter(item => 
        item.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error("Error searching history:", error);
      throw error;
    }
  }
}

export const userHistoryService = new UserHistoryService();
