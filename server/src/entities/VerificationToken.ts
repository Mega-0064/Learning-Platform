import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  Index
} from 'typeorm';
import { User } from './User';
import * as crypto from 'crypto';

@Entity('verification_tokens')
export class VerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  token: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.verificationTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @BeforeInsert()
  generateToken() {
    // Generate a random token
    this.token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 24 hours from now
    const now = new Date();
    this.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  /**
   * Check if the token is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if the token is valid (not used and not expired)
   */
  isValid(): boolean {
    return !this.isUsed && !this.isExpired();
  }
}

