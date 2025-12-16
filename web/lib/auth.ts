import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getSiteConfig } from './db';

async function getStoredPasswordHash(): Promise<string | null> {
  try {
    const client = (await import('./db')).pool.connect();
    const conn = await client;

    try {
      const result = await conn.query(
        "SELECT value->>'site_password_hash' as hash FROM site_config WHERE key = 'auth_config'"
      );

      if (result.rows.length > 0) {
        return result.rows[0].hash;
      }

      // Fallback to environment variable for backward compatibility
      const envPassword = process.env.SITE_PASSWORD;
      return envPassword ? await bcrypt.hash(envPassword, 10) : null;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Failed to get password hash:', error);
    // Fallback to environment variable
    const envPassword = process.env.SITE_PASSWORD;
    return envPassword ? await bcrypt.hash(envPassword, 10) : null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.password) {
          return null;
        }

        const storedHash = await getStoredPasswordHash();
        if (!storedHash) {
          throw new Error('Site password not configured');
        }

        const isValid = await bcrypt.compare(credentials.password, storedHash);
        if (!isValid) {
          return null;
        }

        return {
          id: 'site-user',
          name: 'Site User',
          email: 'user@edthing.local',
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = (token as any).id as string;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);

// Helper function to check if auth is required
export async function requiresAuth(): Promise<boolean> {
  try {
    const config = await getSiteConfig();
    return config.require_auth;
  } catch (error) {
    // Default to requiring auth if config can't be loaded
    return true;
  }
}
