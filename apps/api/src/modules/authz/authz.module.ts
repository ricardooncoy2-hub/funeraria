import { Global, Module } from '@nestjs/common';
import { SedeScopeService } from './sede-scope.service';

@Global()
@Module({
  providers: [SedeScopeService],
  exports: [SedeScopeService],
})
export class AuthzModule {}
