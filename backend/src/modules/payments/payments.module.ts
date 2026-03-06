import { Module }            from '@nestjs/common';
import { TypeOrmModule }     from '@nestjs/typeorm';
import { BoletoPago }        from './boleto-pago.entity';
import { Client }            from '../clients/client.entity';
import { PaymentsService }   from './payments.service';
import { PaymentsController }from './payments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BoletoPago, Client])],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
