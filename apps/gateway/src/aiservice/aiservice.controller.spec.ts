import { Test, TestingModule } from '@nestjs/testing';
import { AiserviceController } from './aiservice.controller';

describe('AiserviceController', () => {
  let controller: AiserviceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiserviceController],
    }).compile();

    controller = module.get<AiserviceController>(AiserviceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
