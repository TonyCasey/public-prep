import { randomBytes } from 'crypto';
import { db } from '../db';
import { passwordResetTokens } from '@shared/passwordReset';
import { eq, and, gte } from 'drizzle-orm';

const TOKEN_EXPIRY_HOURS = 1;

export async function generatePasswordResetToken(email: string): Promise<string | null> {
  try {
    // Generate secure random token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Store token in database
    await db.insert(passwordResetTokens).values({
      email,
      token,
      expiresAt,
      used: false
    });

    console.log('Password reset token generated for:', email);
    return token;
  } catch (error) {
    console.error('Error generating password reset token:', error);
    return null;
  }
}

export async function validatePasswordResetToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const now = new Date();
    
    // Find valid token
    const tokenRecord = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gte(passwordResetTokens.expiresAt, now)
        )
      )
      .limit(1);

    if (tokenRecord.length === 0) {
      console.log('Invalid or expired password reset token:', token);
      return null;
    }

    const record = tokenRecord[0];
    console.log('Valid password reset token found for:', record.email);
    
    return {
      userId: record.email, // We'll look up the actual user ID by email
      email: record.email
    };
  } catch (error) {
    console.error('Error validating password reset token:', error);
    return null;
  }
}

export async function markTokenAsUsed(token: string): Promise<boolean> {
  try {
    const result = await db
      .update(passwordResetTokens)
      .set({ 
        used: true,
        usedAt: new Date()
      })
      .where(eq(passwordResetTokens.token, token));

    console.log('Password reset token marked as used:', token);
    return true;
  } catch (error) {
    console.error('Error marking token as used:', error);
    return false;
  }
}

export async function cleanupExpiredTokens(): Promise<void> {
  try {
    const now = new Date();
    
    await db
      .delete(passwordResetTokens)
      .where(gte(passwordResetTokens.expiresAt, now));
    
    console.log('Expired password reset tokens cleaned up');
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
}