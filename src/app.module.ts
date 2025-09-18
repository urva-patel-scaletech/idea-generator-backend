import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import { UsersModule } from './users/users.module';
import { AssistantsModule } from './assistants/assistants.module';
import { ThreadsModule } from './threads/threads.module';
import { MessagesModule } from './messages/messages.module';
import { AuthModule } from './auth/auth.module';
import { OpenAiModule } from './openai/openai.module';
import { SeedModule } from './seed/seed.module';
import { SeedService } from './seed/seed.service';
import { GenerateModule } from './generate/generate.module';
import { TrendingModule } from './trending/trending.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    UsersModule,
    AssistantsModule,
    ThreadsModule,
    MessagesModule,
    AuthModule,
    OpenAiModule,
    SeedModule,
    GenerateModule,
    TrendingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly seedService: SeedService) {}

  async onModuleInit() {
    await this.seedService.seedAssistants();
  }
}
