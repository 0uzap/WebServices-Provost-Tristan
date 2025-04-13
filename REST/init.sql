CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  about VARCHAR(500),
  price FLOAT,
  reviews_ids INTEGER[], 
  note FLOAT DEFAULT 0 
);

INSERT INTO products (name, about, price) VALUES
  ('My first game', 'This is an awesome game', '60');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100),
  email VARCHAR(500),
  password VARCHAR(500)
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  product_ids INTEGER[],
  total FLOAT,
  payment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CREATE TABLE reviews (
--   id SERIAL PRIMARY KEY,
--   user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
--   product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
--   score INTEGER CHECK (score >= 1 AND score <= 5),
--   content TEXT,
--   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

