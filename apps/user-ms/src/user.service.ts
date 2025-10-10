import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
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
}
