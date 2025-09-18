import { Injectable } from '@nestjs/common';
import { Request } from 'express';

export interface DeviceInfo {
  deviceId: string;
  platform: 'web' | 'mobile';
}

@Injectable()
export class DeviceService {
  extractDeviceInfo(req: Request): DeviceInfo {
    const platform = this.detectPlatform(req);

    if (platform === 'mobile') {
      // For mobile apps, expect device ID in headers
      const deviceId = req.headers['x-device-id'] as string;
      if (!deviceId) {
        throw new Error('Mobile device ID is required');
      }
      return {
        deviceId,
        platform: 'mobile',
      };
    }

    // For web, get device ID from headers (sent by frontend)
    const deviceId = req.headers['x-device-id'] as string;
    if (!deviceId) {
      throw new Error('Device ID is required for anonymous users');
    }

    return {
      deviceId,
      platform: 'web',
    };
  }

  private detectPlatform(req: Request): 'web' | 'mobile' {
    const platformHeader = req.headers['x-device-platform'] as string;

    if (platformHeader === 'mobile') {
      return 'mobile';
    }

    return 'web';
  }
}
