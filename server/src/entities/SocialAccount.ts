import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique
} from 'typeorm';
import { User } from './User';

export enum SocialProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  GITHUB = 'github'
}

@Entity('social_accounts')
@Unique(['providerId', 'provider']) // Ensure provider ID is unique per provider
export class SocialAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SocialProvider
  })
  provider: SocialProvider;

  @Column()
  @Index()
  providerId: string;

  @Column({ nullable: true })
  accessToken: string;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ type: 'jsonb', nullable: true })
  profile: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.socialAccounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  /**
   * Get provider display name
   */
  getProviderName(): string {
    return this.provider.charAt(0).toUpperCase() + this.provider.slice(1);
  }

  /**
   * Check if tokens are valid/expired (implementation depends on provider)
   */
  hasValidTokens(): boolean {
    // This is a placeholder. In a real implementation, you would
    // check token expiration based on provider specifics
    return !!this.accessToken;
  }
}

