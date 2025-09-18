import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AnonymousUserService } from '../users/anonymous-user.service';
import { DeviceService, DeviceInfo } from '../common/services/device.service';
import * as bcrypt from 'bcryptjs';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly anonymousUserService: AnonymousUserService,
    private readonly deviceService: DeviceService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      const { password: _, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: { id: string; email: string; name: string }) {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      name: user.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async register(
    name: string,
    email: string,
    password: string,
    deviceInfo?: DeviceInfo,
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);

    if (deviceInfo) {
      // Try to convert existing anonymous user
      const convertedUser =
        await this.anonymousUserService.convertAnonymousToAuthenticated(
          deviceInfo,
          email,
          hashedPassword,
          name,
        );

      if (convertedUser) {
        return this.login({
          id: convertedUser.id,
          email: convertedUser.email!,
          name: convertedUser.name!,
        });
      }
    }

    // Create new authenticated user
    const user = await this.usersService.create({
      name,
      email,
      password: hashedPassword,
    });

    return this.login({
      id: user.id,
      email: user.email!,
      name: user.name!,
    });
  }

  async registerWithDeviceInfo(
    name: string,
    email: string,
    password: string,
    req: any,
  ) {
    const deviceInfo = this.deviceService.extractDeviceInfo(req);
    return this.register(name, email, password, deviceInfo);
  }
}
