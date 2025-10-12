import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

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
  LOGIN = 'LOGIN', // Done
  DOWNLOADED_RESOURCE = 'DOWNLOADED_RESOURCE', //Done
  UPLOADED_RESOURCE = 'UPLOADED_RESOURCE', // Done
  JOINED_WHITEBOARD = 'JOINED_WHITEBOARD', // Done
  JOINED_DOCUMENT = 'JOINED_DOCUMENT', // Done
  ADDED_TO_GROUP = 'ADDED_TO_GROUP', // Done
  ADDED_TO_WORKSPACE = 'ADDED_TO_WORKSPACE', // Done
  CREATED_GROUP = 'CREATED_GROUP', // Done
  POSTED_MESSAGE = 'POSTED_MESSAGE', //Done

  // Student-side
  STARTED_QUIZ = 'STARTED_QUIZ',
  SUBMITTED_QUIZ = 'SUBMITTED_QUIZ',
  GENERATED_STUDY_PLAN = 'GENERATED_STUDY_PLAN', //Done
  GENERATED_FLASHCARDS = 'GENERATED_FLASHCARDS',

  // Tutor-side
  CREATED_QUIZ = 'CREATED_QUIZ',

  // Admin-side
  DELETED_GROUP = 'DELETED_GROUP', // Done
  CREATED_WORKSPACE = 'CREATED_WORKSPACE', // Done
  DELETED_WORKSPACE = 'DELETED_WORKSPACE',
}

export const ActivityMessageMap: Record<ActivityType, string> = {
  // Common
  [ActivityType.LOGIN]: 'logged in',
  [ActivityType.DOWNLOADED_RESOURCE]: 'downloaded  resource',
  [ActivityType.UPLOADED_RESOURCE]: 'uploaded  resource',
  [ActivityType.GENERATED_FLASHCARDS]: 'generated flashcards',
  [ActivityType.JOINED_WHITEBOARD]: 'collaborated on whiteboard',
  [ActivityType.JOINED_DOCUMENT]: 'collaborated on Document',
  [ActivityType.ADDED_TO_GROUP]: 'was added to  group',
  [ActivityType.ADDED_TO_WORKSPACE]: 'was added to  workspace',
  [ActivityType.CREATED_GROUP]: 'created  new group',
  [ActivityType.POSTED_MESSAGE]: 'posted  message',

  // Student-side(user)
  [ActivityType.STARTED_QUIZ]: 'started quiz',
  [ActivityType.SUBMITTED_QUIZ]: 'submitted quiz',
  [ActivityType.GENERATED_STUDY_PLAN]: 'generated study plan',

  // Tutor-sid
  [ActivityType.CREATED_QUIZ]: 'created quiz',

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
    ActivityType.GENERATED_FLASHCARDS,
    ActivityType.JOINED_WHITEBOARD,
    ActivityType.JOINED_DOCUMENT,
    ActivityType.ADDED_TO_GROUP,
    ActivityType.ADDED_TO_WORKSPACE,
    ActivityType.STARTED_QUIZ,
    ActivityType.SUBMITTED_QUIZ,
    ActivityType.GENERATED_STUDY_PLAN,
    ActivityType.POSTED_MESSAGE,
  ],
  tutor: [
    ActivityType.LOGIN,
    ActivityType.UPLOADED_RESOURCE,
    ActivityType.DOWNLOADED_RESOURCE,
    ActivityType.JOINED_WHITEBOARD,
    ActivityType.JOINED_DOCUMENT,
    ActivityType.ADDED_TO_GROUP,
    ActivityType.ADDED_TO_WORKSPACE,
    ActivityType.CREATED_QUIZ,
    ActivityType.CREATED_GROUP,
    ActivityType.POSTED_MESSAGE,
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
}
