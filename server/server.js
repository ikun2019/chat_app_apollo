import { ApolloServer } from '@apollo/server';
import { expressMiddleware as apolloMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { readFile } from 'node:fs/promises';
import { authMiddleware, handleLogin } from './auth.js';
import { resolvers } from './resolvers.js';

const PORT = 9000;

// * Serverの初期化
const app = express();
const httpServer = new createServer(app);
const webServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
app.use(cors(), express.json());

app.post('/login', handleLogin);

function getContext({ req }) {
  if (req.auth) {
    return { user: req.auth.sub };
  }
  return {};
}

const typeDefs = await readFile('./schema.graphql', 'utf8');
const schema = makeExecutableSchema({ typeDefs, resolvers });

const apolloServer = new ApolloServer({ schema });

await apolloServer.start();
// * ApolloとExpressの連結
app.use('/graphql', authMiddleware, apolloMiddleware(apolloServer, {
  context: getContext,
}));
// * WebSocketの設定
useServer({
  schema,
  context: getContext,
}, webServer);

httpServer.listen({ port: PORT }, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
});
