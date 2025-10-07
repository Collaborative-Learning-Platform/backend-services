import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserActivitySession } from './user-activity-session.entity';

export enum ActivityCategory {
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

  // Student-side
  STARTED_QUIZ = 'STARTED_QUIZ',
  COMPLETED_QUIZ = 'COMPLETED_QUIZ',
  JOINED_STUDY_GROUP = 'JOINED_STUDY_GROUP',
  SUBMITTED_ASSIGNMENT = 'SUBMITTED_ASSIGNMENT',
  GENERATED_STUDY_PLAN = 'GENERATED_STUDY_PLAN',

  // Tutor-side
  RECEIVED_SUBMISSION = 'RECEIVED_SUBMISSION', // optional, when student submits
  CREATED_QUIZ = 'CREATED_QUIZ',
  GRADED_ASSIGNMENT = 'GRADED_ASSIGNMENT',

  // Admin-side
  DELETED_GROUP = 'DELETED_GROUP',
  CREATED_WORKSPACE = 'CREATED_WORKSPACE',
}

export const ActivityMessageMap: Record<ActivityType, string> = {
  // Common
  [ActivityType.LOGIN]: 'logged in',
  [ActivityType.DOWNLOADED_RESOURCE]: 'downloaded a resource',
  [ActivityType.UPLOADED_RESOURCE]: 'uploaded a resource',
  [ActivityType.GENERATED_FLASHCARD]: 'generated flashcards',
  [ActivityType.JOINED_WHITEBOARD]: 'joined a whiteboard session',
  [ActivityType.JOINED_DOCUMENT]: 'joined a collaborative document',
  [ActivityType.ADDED_TO_GROUP]: 'was added to a group',
  [ActivityType.ADDED_TO_WORKSPACE]: 'was added to a workspace',
  [ActivityType.CREATED_GROUP]: 'created a new group',
  [ActivityType.POSTED_MESSAGE]: 'posted a message',

  // Student-side
  [ActivityType.STARTED_QUIZ]: 'started a quiz',
  [ActivityType.COMPLETED_QUIZ]: 'completed a quiz',
  [ActivityType.JOINED_STUDY_GROUP]: 'joined a study group',
  [ActivityType.SUBMITTED_ASSIGNMENT]: 'submitted an assignment',
  [ActivityType.GENERATED_STUDY_PLAN]: 'generated a study plan',

  // Tutor-side
  [ActivityType.RECEIVED_SUBMISSION]: 'received a student submission',
  [ActivityType.CREATED_QUIZ]: 'created a quiz',
  [ActivityType.GRADED_ASSIGNMENT]: 'graded an assignment',

  // Admin-side
  [ActivityType.DELETED_GROUP]: 'deleted a group',
  [ActivityType.CREATED_WORKSPACE]: 'created a workspace',
};

export const RoleActivityMap = {
  student: [
    ActivityType.LOGIN,
    ActivityType.DOWNLOADED_RESOURCE,
    ActivityType.UPLOADED_RESOURCE,
    ActivityType.GENERATED_FLASHCARD,
    ActivityType.JOINED_WHITEBOARD,
    ActivityType.JOINED_DOCUMENT,
    ActivityType.ADDED_TO_GROUP,
    ActivityType.ADDED_TO_WORKSPACE,
    ActivityType.STARTED_QUIZ,
    ActivityType.COMPLETED_QUIZ,
    ActivityType.JOINED_STUDY_GROUP,
    ActivityType.SUBMITTED_ASSIGNMENT,
    ActivityType.GENERATED_STUDY_PLAN,
    ActivityType.POSTED_MESSAGE,
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
  ],
  admin: [
    ActivityType.LOGIN,
    ActivityType.CREATED_WORKSPACE,
    ActivityType.DELETED_GROUP,
    ActivityType.CREATED_GROUP,
  ],
} as const;

@Entity('user_activity_log')
export class UserActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid')
  user_id: string;

  @Column({ type: 'varchar', length: 20 })
  role: 'STUDENT' | 'TUTOR' | 'ADMIN';

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
