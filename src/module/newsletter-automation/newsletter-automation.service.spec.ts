import { Test, TestingModule } from '@nestjs/testing';
import { NewsletterAutomationService } from './newsletter-automation.service';

describe('NewsletterAutomationService', () => {
  let service: NewsletterAutomationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NewsletterAutomationService],
    }).compile();

    service = module.get<NewsletterAutomationService>(NewsletterAutomationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
