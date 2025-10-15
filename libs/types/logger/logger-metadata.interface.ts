export interface ResourceMetadata {
  resourceId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

export interface FlashcardCreateMetadata {
  flashcardId: string;
  title: string;
  subject: string;
  fileName: string;
  contentType: string;
  flashcardCount: string;
  generatedAt: string;
}

export interface FlashcardDeleteMetadata {
  flashcardId: string;
  title: string;
  deletedAt: string;
}

export interface WhiteboardMetadata {
  groupId: string;
  workspaceId: string;
  groupName: string;
}

export interface DocumentMetadata {
  name: string;
  title: string;
  createdBy: string;
  groupId: string;
}

export interface WorkspaceAddMetadata {
  workspaceId: string;
  name: string;
  createdBy: string;
}

export interface WorkspaceCreateMetadata {
  workspaceId: string;
  workspaceName: string;
  createdAt: string;
}

export interface GroupMetadata {
  groupId: string;
  workspaceId: string;
  name: string;
  type: string;
  deletedBy?: string;
}

export interface ChatMetadata {
  groupId: string;
  groupName: string;
  messageLength: string;
  sender: string;
}

export interface CreateQuizMetadata {
  quizId: string;
  quizTitle: string;
  groupName: string;
  groupId: string;
  dueDate: string;
}
export interface QuizMetadata {
  quizId: string;
  quizTitle: string;
  groupId: string;
  description: string;
}

export interface WhiteboardMetadata {
  whiteboardId: string;
  sessionId?: string;
  participants?: string[];
}

export interface DocumentMetadata {
  documentId: string;
  documentName: string;
  collaborators?: string[];
}
