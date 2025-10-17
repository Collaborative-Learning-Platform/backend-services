import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  TUTOR = 'tutor',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  hashed_password: string;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @Column({ nullable: true })
  profile_picture: string;

  @Column({ default: true })
  first_time_user: boolean;
}

export enum CursorType {
  DEFAULT = 'default',
  TEXT = 'text',
  RESIZE_CORNER = 'resize-corner',
  NESW_ROTATE = 'nesw-rotate',
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
}

@Entity()
export class UserPreferences {
  @PrimaryColumn('uuid')
  user_id: string;

  // Whiteboard settings
  @Column({ default: true })
  showGrid: boolean;

  @Column({ type: 'int', default: 3 })
  defaultBrushSize: number;

  @Column({ type: 'enum', enum: CursorType, default: CursorType.DEFAULT })
  defaultCursorType: CursorType;

  @Column({ type: 'float', default: 1.1 })
  lineHeight: number;

  // Document editor preferences
  @Column({ type: 'int', default: 14 })
  fontSize: number;

  @Column({ default: true })
  emailNotifications: boolean;

  // Theme preferences
  @Column({ type: 'enum', enum: ThemeMode, default: ThemeMode.LIGHT })
  themeMode: ThemeMode;

  @Column({ default: 'primary' })
  accentColor: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
