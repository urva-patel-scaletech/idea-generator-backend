import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AnonymousUserService } from './anonymous-user.service';
import { User } from '../entities/user.entity';
import { DeviceService } from '../common/services/device.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, AnonymousUserService, DeviceService],
  exports: [UsersService, AnonymousUserService, DeviceService],
})
export class UsersModule {}
