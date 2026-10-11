import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('instituicao')
export class Instituicao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120, unique: true })
  nome: string;
}
