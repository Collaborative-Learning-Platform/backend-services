import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserActivitySession } from './user-activity-session.entity';

export enum ActivityCategory {
  GENERAL = 'GENERAL', //Login, Logout
  AI_LEARNING = 'AI_LEARNING', //Flashcard, Study Plan
  COLLABORATION = 'COLLABORATION', // Whiteboard, DocumentEditor
  COMMUNICATION = 'COMMUNICATION', //Chat, Announcements(?)
  RESOURCE = 'RESOURCE', //Uploaded/Downloaded resource
  QUIZ = 'QUIZ', //Quiz Related
}

export enum ActivityType {
  // Common
  LOGIN = 'LOGIN',
  DOWNLOADED_RESOURCE = 'DOWNLOADED_RESOURCE',
  UPLOADED_RESOURCE = 'UPLOADED_RESOURCE',
  GENERATED_FLASHCARD = 'GENERATED_FLASHCARD',
  JOINED_WHITEBOARD = 'JOINED_WHITEBOARD',
  JOINED_DOCUMENT = 'JOINED_DOCUMENT',
  ADDED_TO_GROUP = 'ADDED_TO_GROUP',
  ADDED_TO_WORKSPACE = 'ADDED_TO_WORKSPACE',
  CREATED_GROUP = 'CREATED_GROUP',
  POSTED_MESSAGE = 'POSTED_MESSAGE',
  VIEWED_FLASHCARDS = 'VIEWED FLASHCARDS',
  VIEWED_RESOURCE = 'VIEWED_RESOURCE',
  VIEWED_CHAT = 'VIEWED_CHAT',

  // Student-side
  STARTED_QUIZ = 'STARTED_QUIZ',
  SUBMITTED_QUIZ = 'SUBMITTED_QUIZ',
  JOINED_STUDY_GROUP = 'JOINED_STUDY_GROUP',
  SUBMITTED_ASSIGNMENT = 'SUBMITTED_ASSIGNMENT',
  GENERATED_STUDY_PLAN = 'GENERATED_STUDY_PLAN',
  VIEWED_STUDY_PLAN = 'VIEWED_STUDY_PLAN',

  // Tutor-side
  RECEIVED_SUBMISSION = 'RECEIVED_SUBMISSION', // optional, when student submits
  CREATED_QUIZ = 'CREATED_QUIZ',
  GRADED_ASSIGNMENT = 'GRADED_ASSIGNMENT',

  // Admin-side
  DELETED_GROUP = 'DELETED_GROUP',
  CREATED_WORKSPACE = 'CREATED_WORKSPACE',
  DELETED_WORKSPACE = 'DELETED_WORKSPACE',
}

export const ActivityMessageMap: Record<ActivityType, string> = {
  // Common
  [ActivityType.LOGIN]: 'logged in',
  [ActivityType.DOWNLOADED_RESOURCE]: 'downloaded  resource',
  [ActivityType.UPLOADED_RESOURCE]: 'uploaded  resource',
  [ActivityType.GENERATED_FLASHCARD]: 'generated flashcards',
  [ActivityType.JOINED_WHITEBOARD]: 'joined  whiteboard session',
  [ActivityType.JOINED_DOCUMENT]: 'joined  collaborative document',
  [ActivityType.ADDED_TO_GROUP]: 'was added to  group',
  [ActivityType.ADDED_TO_WORKSPACE]: 'was added to  workspace',
  [ActivityType.CREATED_GROUP]: 'created  new group',
  [ActivityType.POSTED_MESSAGE]: 'posted  message',
  [ActivityType.VIEWED_FLASHCARDS]: 'viewed flashcards',
  [ActivityType.VIEWED_RESOURCE]: 'viewed  resource',
  [ActivityType.VIEWED_CHAT]: 'viewed  chat',

  // Student-side(user)
  [ActivityType.STARTED_QUIZ]: 'started quiz',
  [ActivityType.SUBMITTED_QUIZ]: 'submitted quiz',
  [ActivityType.JOINED_STUDY_GROUP]: 'joined study group',
  [ActivityType.SUBMITTED_ASSIGNMENT]: 'submitted assignment',
  [ActivityType.GENERATED_STUDY_PLAN]: 'generated study plan',
  [ActivityType.VIEWED_STUDY_PLAN]: 'viewed study plan',

  // Tutor-side
  [ActivityType.RECEIVED_SUBMISSION]: 'received student submission',
  [ActivityType.CREATED_QUIZ]: 'created quiz',
  [ActivityType.GRADED_ASSIGNMENT]: 'graded assignment',

  // Admin-side
  [ActivityType.DELETED_GROUP]: 'deleted group',
  [ActivityType.CREATED_WORKSPACE]: 'created workspace',
  [ActivityType.DELETED_WORKSPACE]: 'deleted workspace',
};

export const RoleActivityMap = {
  user: [
    ActivityType.LOGIN,
    ActivityType.DOWNLOADED_RESOURCE,
    ActivityType.UPLOADED_RESOURCE,
    ActivityType.GENERATED_FLASHCARD,
    ActivityType.JOINED_WHITEBOARD,
    ActivityType.JOINED_DOCUMENT,
    ActivityType.ADDED_TO_GROUP,
    ActivityType.ADDED_TO_WORKSPACE,
    ActivityType.STARTED_QUIZ,
    ActivityType.SUBMITTED_QUIZ,
    ActivityType.JOINED_STUDY_GROUP,
    ActivityType.SUBMITTED_ASSIGNMENT,
    ActivityType.GENERATED_STUDY_PLAN,
    ActivityType.VIEWED_STUDY_PLAN,
    ActivityType.POSTED_MESSAGE,
    ActivityType.VIEWED_FLASHCARDS,
    ActivityType.VIEWED_RESOURCE,
    ActivityType.VIEWED_CHAT,
  ],
  tutor: [
    ActivityType.LOGIN,
    ActivityType.UPLOADED_RESOURCE,
    ActivityType.DOWNLOADED_RESOURCE,
    ActivityType.GENERATED_FLASHCARD,
    ActivityType.JOINED_WHITEBOARD,
    ActivityType.JOINED_DOCUMENT,
    ActivityType.ADDED_TO_GROUP,
    ActivityType.ADDED_TO_WORKSPACE,
    ActivityType.RECEIVED_SUBMISSION,
    ActivityType.CREATED_QUIZ,
    ActivityType.GRADED_ASSIGNMENT,
    ActivityType.CREATED_GROUP,
    ActivityType.POSTED_MESSAGE,
    ActivityType.VIEWED_FLASHCARDS,
    ActivityType.VIEWED_RESOURCE,
    ActivityType.VIEWED_CHAT,
  ],
  admin: [
    ActivityType.LOGIN,
    ActivityType.CREATED_WORKSPACE,
    ActivityType.DELETED_GROUP,
    ActivityType.DELETED_WORKSPACE,
    ActivityType.CREATED_GROUP,
  ],
} as const;

@Entity('user_activity_log')
export class UserActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column({ type: 'varchar', length: 20 })
  role: 'USER' | 'TUTOR' | 'ADMIN';

  @Column({ type: 'varchar', length: 60 })
  category: ActivityCategory;

  @Column({ type: 'varchar', length: 60 })
  activity_type: ActivityType; // enum (LOGIN, QUIZ_ATTEMPTED, etc.)

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @OneToOne(() => UserActivitySession, (session) => session.activity_log)
  sessions: UserActivitySession;
}
