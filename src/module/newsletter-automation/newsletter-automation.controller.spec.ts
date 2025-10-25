import { Test, TestingModule } from '@nestjs/testing';
import { NewsletterAutomationController } from './newsletter-automation.controller';
import { NewsletterAutomationService } from './newsletter-automation.service';

describe('NewsletterAutomationController', () => {
  let controller: NewsletterAutomationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewsletterAutomationController],
      providers: [NewsletterAutomationService],
    }).compile();

    controller = module.get<NewsletterAutomationController>(NewsletterAutomationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
