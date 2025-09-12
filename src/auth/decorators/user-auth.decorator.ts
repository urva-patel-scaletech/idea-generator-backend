import { SetMetadata } from '@nestjs/common';

export const USER_AUTH_KEY = 'userAuth';
export const UserAuth = () => SetMetadata(USER_AUTH_KEY, true);
