const express = require("express");
const postgres = require("postgres");
const z = require("zod");
const { createHash } = require("node:crypto");

const app = express();
const port = 8000;
const sql = postgres({ db: "mydb", user: "user", password: "password" });

app.use(express.json());

// Schemas
const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  about: z.string(),
  price: z.number().positive(),
});
const CreateProductSchema = ProductSchema.omit({ id: true });

app.post("/products", async (req, res) => {
  const result = await CreateProductSchema.safeParse(req.body);

  if (result.success) {
    const { name, about, price } = result.data;

    const product = await sql`
      INSERT INTO products (name, about, price)
      VALUES (${name}, ${about}, ${price})
      RETURNING *
      `;

    res.send(product[0]);
  } else {
    res.status(400).send(result);
  }
});

// app.get("/products", async (req, res) => {
//   const { name, about, price } = req.query;
// // J4EN SUIS ICI
//   try {
//     const fields = [];
//     if (name) {
//       fields.push("name");
//     }
//     if (about) {
//       fields.push("about");
//     }
//     if (price) {
//       fields.push("price");
//     }

//     const products = await sql`
//     SELECT * FROM products
//     ${name} 
//     ${about}
//     ${price}
//     `;

//     res.send(products);
//   } catch (error) {}
// });


app.get("/products", async (req, res) => {
  try {
    const { name, about, price } = req.query;

    const response = await fetch("https://www.freetogame.com/api/games");
    if (!response.ok) {
      return res.status(502).send({ message: "Echec fetch de jeux de l'API." });
    }

    let games = await response.json();

    if (name) {
      games = games.filter(game =>
        game.title.toLowerCase().includes(name.toLowerCase())
      );
    }

    if (about) {
      games = games.filter(game =>
        game.short_description.toLowerCase().includes(about.toLowerCase())
      );
    }

    // Simulation d'un prix vu qu'il y en a pas dan l'api??...
    if (price) {
      games = games.map(game => ({
        ...game,
        price: Math.floor(Math.random() * 51), 
      }));

      games = games.filter(game => game.price <= Number(price));
    }

    res.send(games);
  } catch (error) {
    console.error("Error fetching or filtering games:", error);
    res.status(500).send({ message: "Server error while filtering games." });
  }
});



app.get("/products/:id", async (req, res) => {
  const product = await sql`
      SELECT * FROM products WHERE id=${req.params.id}
      `;

  if (product.length > 0) {
    res.send(product[0]);
  } else {
    res.status(404).send({ message: "Not found" });
  }
});

app.delete("/products/:id", async (req, res) => {
  const product = await sql`
      DELETE FROM products
      WHERE id=${req.params.id}
      RETURNING *
      `;

  if (product.length > 0) {
    res.send(product[0]);
  } else {
    res.status(404).send({ message: "Not found" });
  }
});

const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  password: z.string(),
});

const CreateUserSchema = UserSchema.omit({ id: true });

const patchUserSchema = z.object({
  username: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
});

app.get("/users", async (req, res) => {
  const users = await sql`
      SELECT id, username, email FROM users
      `;

  res.send(users);
});

app.post("/users", async (req, res) => {
  const result = await CreateUserSchema.safeParse(req.body);

  // If Zod parsed successfully the request body
  if (result.success) {
    const { username, email, password } = result.data;

    const hash = createHash("sha512").update(password).digest("hex");

    const user = await sql`
      INSERT INTO users (username, email, password)
      VALUES (${username}, ${email}, ${hash})
      RETURNING username, email
      `;

    res.send(user[0]);
  } else {
    res.status(400).send(result);
  }
});

app.delete("/users/:id", async (req, res) => {
  const user = await sql`
      DELETE FROM users
      WHERE id=${req.params.id}
      RETURNING username, email
      `;

  if (user.length > 0) {
    res.send(user[0]);
  } else {
    res.status(404).send({ message: "Not found" });
  }
});

app.put("/users/:id", async (req, res) => {
  const result = await CreateUserSchema.safeParse(req.body);

  if (result.success) {
    const { username, email, password } = result.data;

    const hash = createHash("sha512").update(password).digest("hex");

    const user = await sql`
     UPDATE users
     SET username = ${username}, email = ${email}, password = ${hash}
     WHERE id= ${req.params.id}
      RETURNING username, email
      `;
    console.log(user);
    res.send(user[0]);
  } else {
    res.status(400).send(result);
  }
});

app.patch("/users/:id", async (req, res) => {
  const result = await patchUserSchema.safeParse(req.body);

  if (result.success) {
    const { username, email, password } = result.data;
    const fields = [];
    if (username) {
      fields.push("username");
    }
    if (email) {
      fields.push("email");
    }
    if (password) {
      const hash = createHash("sha512").update(password).digest("hex");
      fields.push("hash");
    }
    console.log(fields);
    try {
      const user = await sql`
      UPDATE users
      SET ${sql(result.data, fields)}
      WHERE id= ${req.params.id}
      RETURNING username, email
      `;
      res.send(user[0]);
    } catch (error) {
      console.log(error);
    }
  } else {
    res.status(400).send(result);
  }
});

app.get("/f2p-games", async (req, res) => {
  try {
    const response = await fetch("https://www.freetogame.com/api/games");
    if (response.ok) {
      const games = await response.json();
      res.send(games);
    }
  } catch (error) {
    console.error("Error fetching F2P games:", error);
    res.status(500).send({ message: "Server error while fetching games." });
  }
});

app.get("/f2p-games/:id", async (req, res) => {
  try {
    const response = await fetch(
      `https://www.freetogame.com/api/game?id=${req.params.id}`
    );
    if (response.ok) {
      const games = await response.json();
      res.send(games);
    }
  } catch (error) {
    console.error("Error fetching F2P games:", error);
    res.status(500).send({ message: "Server error while fetching games." });
  }
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
