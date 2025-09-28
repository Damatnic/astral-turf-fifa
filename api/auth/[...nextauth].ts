import NextAuth, { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL,
    },
  },
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await prisma.$connect();
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              firstName: true,
              lastName: true,
              image: true,
              role: true,
              isActive: true,
              accountLocked: true,
              passwordHash: true
            }
          });

          if (!user) {
            await prisma.systemLog.create({
              data: {
                level: 'warn',
                message: `Failed NextAuth login attempt for non-existent email: ${credentials.email}`,
                securityEventType: 'failed_login',
                metadata: { email: credentials.email, provider: 'credentials' }
              }
            });
            return null;
          }

          if (!user.isActive || user.accountLocked) {
            await prisma.systemLog.create({
              data: {
                level: 'warn',
                message: `Login attempt on inactive/locked account: ${credentials.email}`,
                userId: user.id,
                securityEventType: 'locked_account_access',
                metadata: { email: credentials.email, isActive: user.isActive, accountLocked: user.accountLocked }
              }
            });
            return null;
          }

          if (!user.passwordHash) {
            return null; // OAuth-only account
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
          
          if (!isValidPassword) {
            await prisma.user.update({
              where: { id: user.id },
              data: { failedLoginAttempts: { increment: 1 } }
            });

            await prisma.systemLog.create({
              data: {
                level: 'warn',
                message: `Failed NextAuth login attempt: incorrect password for ${credentials.email}`,
                userId: user.id,
                securityEventType: 'failed_login',
                metadata: { email: credentials.email, provider: 'credentials' }
              }
            });
            return null;
          }

          // Reset failed login attempts on successful login
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lastLoginAt: new Date()
            }
          });

          await prisma.systemLog.create({
            data: {
              level: 'info',
              message: `Successful NextAuth login for user: ${credentials.email}`,
              userId: user.id,
              securityEventType: 'successful_login',
              metadata: { email: credentials.email, provider: 'credentials' }
            }
          });

          await prisma.$disconnect();

          return {
            id: user.id,
            email: user.email,
            name: user.name || `${user.firstName} ${user.lastName}`.trim(),
            image: user.image,
            role: user.role
          };

        } catch (error) {
          console.error('NextAuth credentials authorization error:', error);
          try {
            await prisma.$disconnect();
          } catch (disconnectError) {
            console.error('Failed to disconnect from database:', disconnectError);
          }
          return null;
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account && user) {
        token.accessToken = account.access_token;
        token.userId = user.id;
        token.role = (user as any).role;
      }
      return token;
    },

    async session({ session, token, user }) {
      // Send properties to the client
      if (token) {
        session.accessToken = token.accessToken;
        (session.user as any).id = token.userId || user?.id;
        (session.user as any).role = token.role || (user as any)?.role;
      }
      
      return session;
    },

    async signIn({ user, account, profile, email, credentials }) {
      try {
        await prisma.$connect();

        // Log successful sign in
        await prisma.systemLog.create({
          data: {
            level: 'info',
            message: `User signed in via ${account?.provider || 'unknown'}: ${user.email}`,
            userId: user.id,
            securityEventType: 'successful_login',
            metadata: {
              provider: account?.provider,
              email: user.email,
              name: user.name
            }
          }
        });

        await prisma.$disconnect();
        return true;
      } catch (error) {
        console.error('NextAuth signIn callback error:', error);
        try {
          await prisma.$disconnect();
        } catch (disconnectError) {
          console.error('Failed to disconnect from database:', disconnectError);
        }
        return true; // Don't block sign in due to logging errors
      }
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user'
  },

  events: {
    async signIn(message) {
      console.log('NextAuth: User signed in:', message.user.email);
    },
    
    async signOut(message) {
      console.log('NextAuth: User signed out:', message.token?.email || message.session?.user?.email);
      
      try {
        await prisma.$connect();
        
        const userEmail = message.token?.email || message.session?.user?.email;
        const userId = message.token?.userId || (message.session?.user as any)?.id;
        
        if (userEmail) {
          await prisma.systemLog.create({
            data: {
              level: 'info',
              message: `User signed out: ${userEmail}`,
              userId: userId,
              securityEventType: 'signout',
              metadata: { email: userEmail }
            }
          });
        }
        
        await prisma.$disconnect();
      } catch (error) {
        console.error('NextAuth signOut event error:', error);
        try {
          await prisma.$disconnect();
        } catch (disconnectError) {
          console.error('Failed to disconnect from database:', disconnectError);
        }
      }
    },
    
    async createUser(message) {
      console.log('NextAuth: User created:', message.user.email);
      
      try {
        await prisma.$connect();
        
        await prisma.systemLog.create({
          data: {
            level: 'info',
            message: `New user created via NextAuth: ${message.user.email}`,
            userId: message.user.id,
            securityEventType: 'user_created',
            metadata: {
              email: message.user.email,
              name: message.user.name,
              provider: 'nextauth'
            }
          }
        });
        
        await prisma.$disconnect();
      } catch (error) {
        console.error('NextAuth createUser event error:', error);
        try {
          await prisma.$disconnect();
        } catch (disconnectError) {
          console.error('Failed to disconnect from database:', disconnectError);
        }
      }
    }
  },

  debug: process.env.NODE_ENV === 'development',
  
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);