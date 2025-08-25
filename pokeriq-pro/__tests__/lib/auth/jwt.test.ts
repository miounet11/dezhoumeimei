import { hashPassword, verifyPassword } from '@/lib/auth/jwt';

describe('JWT Authentication', () => {
  describe('Password Hashing', () => {
    it('should hash password successfully', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hashedPassword);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hashedPassword);
      
      expect(isValid).toBe(false);
    });

    it('should handle empty password gracefully', async () => {
      const password = '';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      
      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should handle very long passwords', async () => {
      const password = 'a'.repeat(100); // 100 character password
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      
      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should be case sensitive', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);
      
      const isValidLower = await verifyPassword('testpassword123!', hashedPassword);
      const isValidUpper = await verifyPassword('TESTPASSWORD123!', hashedPassword);
      
      expect(isValidLower).toBe(false);
      expect(isValidUpper).toBe(false);
    });

    it('should handle special characters in password', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;\':"<>?,./';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      
      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });
  });
});