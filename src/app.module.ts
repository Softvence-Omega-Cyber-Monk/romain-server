import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './module/auth/auth.module';
import { ConfigModule,ConfigService } from '@nestjs/config';
import { UserModule } from './module/user/user.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { SeederService } from './seeder/seeder.service';
import { InstitutionModule } from './module/institution/institution.module';
import { SessionModule } from './module/session/session.module';
import { ProgrammeModule } from './module/programme/programme.module';
import { LevelModule } from './module/level/level.module';
import { FeeTypeModule } from './module/fee-type/fee-type.module';
import { SubscriptionModule } from './module/newsletter-subscribe/subscription.module';
import { ContactModule } from './module/contact/contact.module';
import { MailModule } from './module/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // config loader,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('SMTP_HOST'),
          port: Number(config.get<string>('SMTP_PORT') || 587),
          secure: Number(config.get<string>('SMTP_PORT') || 587) === 465,
          auth: {
            user: config.get<string>('SMTP_USER'),
            pass: config.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: config.get<string>('SMTP_FROM') || config.get<string>('SMTP_USER'),
        },
      }),
    }),

    // MailerModule.forRoot({
    //   transport: {
    //     service: 'gmail',
    //     auth: {
    //       user: process.env.EMAIL_USER,
    //       pass: process.env.EMAIL_PASS,
    //     },
    //   },
    //   defaults: {
    //     from: process.env.EMAIL_USER,
    //   },
    // }),
    // ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    InstitutionModule,
    SessionModule,
    ProgrammeModule,
    LevelModule,
    FeeTypeModule,
    SubscriptionModule,
    ContactModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeederService],
})
export class AppModule {}
