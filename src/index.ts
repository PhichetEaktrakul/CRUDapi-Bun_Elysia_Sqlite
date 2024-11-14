import { Elysia, t } from "elysia";
import { swagger } from '@elysiajs/swagger';
import { jwt } from '@elysiajs/jwt';
import { getBooks, getBook, createBook, updateBook, deleteBook, createUser, getUser } from "./model";

const app = new Elysia();

// Middleware setup
app
  .use(
    jwt({
      name: 'jwt', // JWT plugin for authentication
      secret: process.env.JWT_SECRET || ""
    })
  )
  .use(
    swagger({
      documentation: {
        tags: [
          { name: 'Bookstore', description: 'Bookstore endpoints' },
          { name: 'Auth', description: 'Authentication endpoints' }
        ]
      }
    })
  );

//=================== Book Endpoints =========================
// Protect all book routes with JWT authentication
app.guard(
  {
    beforeHandle: async ({ jwt, set, cookie: { auth } }) => {
      const profile = await jwt.verify(auth.value);
      if (!profile) {
        set.status = 401;
        return 'Unauthorized';
      }
    }
  },
  (app) =>
    app
      .get('/books', () => getBooks(), {
        detail: { tags: ['Bookstore'] }
      })
      .get('/books/:id', ({ params }) => getBook(parseInt(params.id)), {
        detail: { tags: ['Bookstore'] }
      })
      .post('/books', ({ body }) => createBook(body), {
        body: t.Object({
          name: t.String(),
          author: t.String(),
          price: t.Number()
        }),
        detail: { tags: ['Bookstore'] }
      })
      .put('/books/:id', ({ params, body }) => updateBook(parseInt(params.id), body), {
        body: t.Object({
          name: t.Optional(t.String()),
          author: t.Optional(t.String()),
          price: t.Optional(t.Number())
        }),
        detail: { tags: ['Bookstore'] }
      })
      .delete('/books/:id', ({ params }) => deleteBook(parseInt(params.id)), {
        detail: { tags: ['Bookstore'] }
      })
);

//=================== Authentication Endpoints ======================
app
  .post('/register', async ({ body }) => createUser(body), {
    body: t.Object({
      email: t.String(),
      password: t.String()
    }),
    detail: { tags: ['Auth'] }
  })
  .post('/login', async ({ body, jwt, set, cookie: { auth } }) => {
    const userResponse = await getUser(body);
    if (!userResponse.success) {
      set.status = 400;
      return { error: userResponse.message };
    } else {
      auth.set({
        value: await jwt.sign(body.email),
        httpOnly: true,
        maxAge: 7 * 86400
      });
      return { message: "Login Success" };
    }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String()
    }),
    detail: { tags: ['Auth'] }
  });

// Start the server
app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);