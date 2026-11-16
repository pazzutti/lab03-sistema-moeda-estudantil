import { PartialType } from '@nestjs/mapped-types';
import { CreateVantagemDto } from './create-vantagem.dto.js';

/** Na edicao (HU14), todos os campos sao opcionais. */
export class UpdateVantagemDto extends PartialType(CreateVantagemDto) {}
