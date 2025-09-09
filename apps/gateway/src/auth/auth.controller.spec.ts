// import { Test, TestingModule } from '@nestjs/testing';
// import { AuthController } from './auth.controller';
// import { ClientProxy } from '@nestjs/microservices';
// import { of } from 'rxjs';

// describe('AuthController', () => {
//   let controller: AuthController;
//   let authClient: ClientProxy;

//   const mockAuthClient = {
//     send: jest.fn().mockImplementation(() => of({ token: 'mockToken' })),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [AuthController],
//       providers: [
//         {
//           provide: 'AUTH_SERVICE',
//           useValue: mockAuthClient,
//         },
//       ],
//     }).compile();

//     controller = module.get<AuthController>(AuthController);
//     authClient = module.get<ClientProxy>('AUTH_SERVICE');
//   });

//   it('should be defined', () => {
//     expect(controller).toBeDefined();
//   });

//   describe('login', () => {
//     it('should call authClient with correct parameters and return a token', async () => {
//       const loginDto = { username: 'test', password: 'password' };
//       const result = await controller.login(loginDto);

//       expect(authClient.send).toHaveBeenCalledWith({ cmd: 'auth_login' }, loginDto);
//       expect(result).toEqual({ token: 'mockToken' });
//     });
//   });
// });
