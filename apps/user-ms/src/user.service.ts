import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CursorType,
  ThemeMode,
  User,
  UserPreferences,
} from './entity/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,

    @InjectRepository(UserPreferences)
    private preferencesRepository: Repository<UserPreferences>,
  ) {}

  async updateUserName(updateUserDto: UpdateUserDto) {
    const id = updateUserDto.id;
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return {
        success: false,
        message: `User with id ${id} not found`,
        status: 404,
      };
    }

    try {
      // Update only the name (safer)
      await this.userRepository.update(id, { name: updateUserDto.name });

      const updatedUser = await this.userRepository.findOne({ where: { id } });

      if (!updatedUser) {
        return {
          success: false,
          message: `User with id ${id} not found after update`,
          status: 404,
        };
      }

      return {
        success: true,
        message: 'User name updated successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update user name',
        status: 500,
      };
    }
  }

  async createDefaultPreferences(userID: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userID } });
      if (!user) {
        return {
          success: false,
          message: `User with id ${userID} not found`,
          status: 404,
        };
      }
      const defaultPrefs: Partial<UserPreferences> = {
        user_id: userID,
        showGrid: true,
        defaultBrushSize: 3,
        defaultCursorType: CursorType.DEFAULT,
        fontSize: 14,
        emailNotifications: true,
        themeMode: ThemeMode.LIGHT,
        accentColor: 'primary',
      };

      const preferences = this.preferencesRepository.create(defaultPrefs);
      const result = await this.preferencesRepository.save(preferences);
      return {
        success: true,
        message: 'Created Defaukt user settings successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Cannot create settings for user ${userID}`,
        status: 500,
      };
    }
  }

  // Fetch preferences
  async getPreferences(userID: string) {
    try {
      const prefs = await this.preferencesRepository.findOne({
        where: { user_id: userID },
      });
      if (!prefs) {
        return {
          success: false,
          message: `Preferences for user ${userID} not found`,
          status: 404,
        };
      }
      return {
        success: true,
        message: 'Fetched user preferences successfully',
        data: prefs,
      };
    } catch (error) {
      return {
        success: false,
        message: `Cannot fetch settings for user ${userID}`,
        status: 500,
      };
    }
  }

  // Update preferences
  async updatePreferences(userID: string, updates: Partial<UserPreferences>) {
    try {
      const updated = await this.preferencesRepository.save({
        user_id: userID,
        ...updates,
      });

      return {
        success: true,
        message: 'Updated user preferences successfully',
        data: updated,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: `Cannot update settings for user ${userID}`,
        status: 500,
      };
    }
  }
}
