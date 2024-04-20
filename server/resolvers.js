import { GraphQLError } from 'graphql';
import { createMessage, getMessages } from './db/messages.js';

export const resolvers = {
  Query: {
    messages: (_root, _args, { user }) => {
      if (!user) throw unauthorizedError();
      return getMessages();
    },
  },

  Mutation: {
    addMessage: async (_root, { text }, { user, pubsub }) => {
      if (!user) throw unauthorizedError();
      const message = await createMessage(user, text);
      pubsub.publish('MESSAGE_ADDED', message);
      return message;
    },
  },

  Subscription: {
    messageAdded: {
      subscribe: (parent, args, context) => {
        return context.pubsub.asyncIterator('MESSAGE_ADDED');
      },
      resolve: (payload) => {
        return payload;
      },
    }
  }
};

function unauthorizedError() {
  return new GraphQLError('Not authenticated', {
    extensions: { code: 'UNAUTHORIZED' },
  });
}
