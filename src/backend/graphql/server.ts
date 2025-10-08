/**
 * GraphQL Server Integration
 * 
 * Provides GraphQL API alongside REST endpoints
 * Uses Apollo Server with Express integration
 */

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { Express } from 'express';
import { loggingService } from '../../services/loggingService';

// GraphQL Type Definitions
const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    role: String!
    firstName: String!
    lastName: String!
    createdAt: String!
    isActive: Boolean!
  }

  type Player {
    id: ID!
    name: String!
    jerseyNumber: Int!
    age: Int
    nationality: String
    position: String
    team: String
  }

  type Formation {
    id: ID!
    name: String!
    slots: [FormationSlot!]!
    isActive: Boolean
    popularity: Int
    winRate: Float
  }

  type FormationSlot {
    id: ID!
    role: String!
    defaultPosition: Position!
    playerId: String
  }

  type Position {
    x: Float!
    y: Float!
  }

  type TacticalPreset {
    id: ID!
    name: String!
    description: String
    formationId: String!
    category: String
    createdAt: String!
  }

  type Query {
    # User queries
    me: User
    users: [User!]!
    user(id: ID!): User

    # Player queries
    players: [Player!]!
    player(id: ID!): Player

    # Formation queries
    formations: [Formation!]!
    formation(id: ID!): Formation

    # Tactical preset queries
    tacticalPresets: [TacticalPreset!]!
    tacticalPreset(id: ID!): TacticalPreset
  }

  type Mutation {
    # User mutations
    login(email: String!, password: String!): AuthPayload!
    signup(input: SignupInput!): AuthPayload!
    updateProfile(id: ID!, input: UpdateProfileInput!): User!

    # Formation mutations
    createFormation(input: CreateFormationInput!): Formation!
    updateFormation(id: ID!, input: UpdateFormationInput!): Formation!
    deleteFormation(id: ID!): Boolean!

    # Tactical preset mutations
    createTacticalPreset(input: CreatePresetInput!): TacticalPreset!
    updateTacticalPreset(id: ID!, input: UpdatePresetInput!): TacticalPreset!
    deleteTacticalPreset(id: ID!): Boolean!
  }

  type AuthPayload {
    user: User!
    accessToken: String!
    refreshToken: String!
  }

  input SignupInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    role: String!
  }

  input UpdateProfileInput {
    firstName: String
    lastName: String
    phoneNumber: String
  }

  input CreateFormationInput {
    name: String!
    slots: [FormationSlotInput!]!
  }

  input UpdateFormationInput {
    name: String
    slots: [FormationSlotInput!]
  }

  input FormationSlotInput {
    id: String!
    role: String!
    defaultPosition: PositionInput!
    playerId: String
  }

  input PositionInput {
    x: Float!
    y: Float!
  }

  input CreatePresetInput {
    name: String!
    description: String
    formationId: String!
    category: String
  }

  input UpdatePresetInput {
    name: String
    description: String
    category: String
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    me: async (_parent: any, _args: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      return context.user;
    },

    users: async (_parent: any, _args: any, context: any) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }
      // TODO: Implement with database
      return [];
    },

    user: async (_parent: any, { id }: { id: string }, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      // TODO: Implement with database
      return null;
    },

    players: async (_parent: any, _args: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      // TODO: Implement with database
      return [];
    },

    player: async (_parent: any, { id }: { id: string }, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      // TODO: Implement with database
      return null;
    },

    formations: async (_parent: any, _args: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      // TODO: Implement with database
      return [];
    },

    formation: async (_parent: any, { id }: { id: string }, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      // TODO: Implement with database
      return null;
    },

    tacticalPresets: async (_parent: any, _args: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      // TODO: Implement with database
      return [];
    },

    tacticalPreset: async (_parent: any, { id }: { id: string }, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      // TODO: Implement with database
      return null;
    },
  },

  Mutation: {
    login: async (_parent: any, { email, password }: { email: string; password: string }) => {
      // TODO: Implement actual login logic
      throw new Error('Login via GraphQL not yet implemented - use REST API');
    },

    signup: async (_parent: any, { input }: { input: any }) => {
      // TODO: Implement actual signup logic
      throw new Error('Signup via GraphQL not yet implemented - use REST API');
    },

    updateProfile: async (_parent: any, { id, input }: { id: string; input: any }, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      // TODO: Implement with database
      throw new Error('Update profile via GraphQL not yet implemented');
    },

    createFormation: async (_parent: any, { input }: { input: any }, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      // TODO: Implement with database
      throw new Error('Create formation via GraphQL not yet implemented');
    },

    updateFormation: async (
      _parent: any,
      { id, input }: { id: string; input: any },
      context: any,
    ) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      // TODO: Implement with database
      throw new Error('Update formation via GraphQL not yet implemented');
    },

    deleteFormation: async (_parent: any, { id }: { id: string }, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      // TODO: Implement with database
      throw new Error('Delete formation via GraphQL not yet implemented');
    },

    createTacticalPreset: async (_parent: any, { input }: { input: any }, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      // TODO: Implement with database
      throw new Error('Create preset via GraphQL not yet implemented');
    },

    updateTacticalPreset: async (
      _parent: any,
      { id, input }: { id: string; input: any },
      context: any,
    ) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      // TODO: Implement with database
      throw new Error('Update preset via GraphQL not yet implemented');
    },

    deleteTacticalPreset: async (_parent: any, { id }: { id: string }, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      // TODO: Implement with database
      throw new Error('Delete preset via GraphQL not yet implemented');
    },
  },
};

/**
 * Apply GraphQL middleware to Express app
 */
export async function applyGraphQLMiddleware(app: Express): Promise<void> {
  try {
    // Create executable schema
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    });

    // Create Apollo Server instance
    const server = new ApolloServer({
      schema,
      introspection: process.env.NODE_ENV !== 'production',
      plugins: [
        {
          async requestDidStart() {
            return {
              async didEncounterErrors(requestContext) {
                loggingService.error('GraphQL query error', {
                  error: requestContext.errors?.[0]?.message || 'Unknown error',
                  metadata: {
                    query: requestContext.request.query,
                    variables: requestContext.request.variables,
                  },
                });
              },
            };
          },
        },
      ],
    });

    // Start the server
    await server.start();

    // Apply middleware with authentication context
    app.use(
      '/graphql',
      expressMiddleware(server, {
        context: async ({ req }) => {
          // Extract user from JWT token if present
          const token = req.headers.authorization?.replace('Bearer ', '');
          let user = null;

          if (token) {
            try {
              // TODO: Verify JWT and get user
              // const decoded = jwt.verify(token, process.env.JWT_SECRET);
              // user = await getUserById(decoded.userId);
            } catch (error) {
              loggingService.warn('Invalid GraphQL auth token', {
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }

          return { user };
        },
      }),
    );

    loggingService.info('✅ GraphQL Server integrated successfully at /graphql');
  } catch (error) {
    loggingService.error('❌ Failed to integrate GraphQL Server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export default applyGraphQLMiddleware;


