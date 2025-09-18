import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { DeviceInfo } from '../common/services/device.service';

@Injectable()
export class AnonymousUserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getOrCreateAnonymousUser(deviceInfo: DeviceInfo): Promise<string> {
    // Try to find existing anonymous user for this device
    let anonymousUser = await this.userRepository.findOne({
      where: {
        deviceId: deviceInfo.deviceId,
        platform: deviceInfo.platform,
        isAnonymous: true,
      },
    });

    if (!anonymousUser) {
      // Create new anonymous user for this device
      anonymousUser = await this.userRepository.save({
        isAnonymous: true,
        deviceId: deviceInfo.deviceId,
        platform: deviceInfo.platform,
        createdAt: new Date(),
      });
    }

    return anonymousUser.id;
  }

  async convertAnonymousToAuthenticated(
    deviceInfo: DeviceInfo,
    email: string,
    hashedPassword: string,
    name?: string,
  ): Promise<User | null> {
    // Find the anonymous user for this device
    const anonymousUser = await this.userRepository.findOne({
      where: {
        deviceId: deviceInfo.deviceId,
        platform: deviceInfo.platform,
        isAnonymous: true,
      },
    });

    if (!anonymousUser) {
      return null;
    }

    // Update the anonymous user to authenticated
    await this.userRepository.update(anonymousUser.id, {
      email,
      password: hashedPassword,
      name,
      isAnonymous: false,
      authenticatedAt: new Date(),
    });

    // Return the updated user
    return await this.userRepository.findOne({
      where: { id: anonymousUser.id },
    });
  }

  async findAnonymousUserByDevice(deviceInfo: DeviceInfo): Promise<User | null> {
    return await this.userRepository.findOne({
      where: {
        deviceId: deviceInfo.deviceId,
        platform: deviceInfo.platform,
        isAnonymous: true,
      },
    });
  }

  async cleanupOldAnonymousUsers(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.userRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('isAnonymous = :isAnonymous', { isAnonymous: true })
      .andWhere('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('authenticatedAt IS NULL')
      .execute();

    return result.affected || 0;
  }
}
