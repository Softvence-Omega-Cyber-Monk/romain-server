import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './module/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './module/user/user.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { SeederService } from './seeder/seeder.service';
// import { QuoteModule } from './module/quote/quote.module';
import { InstitutionModule } from './module/institution/institution.module';
import { SessionModule } from './module/session/session.module';
import { ProgrammeModule } from './module/programme/programme.module';
import { LevelModule } from './module/level/level.module';
import { SubscriptionModule } from './module/newsletter-subscribe/subscription.module';
import { ContactModule } from './module/contact/contact.module';



@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
      defaults: {
        from: process.env.EMAIL_USER,
      },
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    InstitutionModule,
    SessionModule,
    ProgrammeModule,
    LevelModule,
    SubscriptionModule,
    ContactModule,
    // QuoteModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeederService],
})
export class AppModule {}
