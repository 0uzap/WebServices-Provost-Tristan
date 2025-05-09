const soap = require("soap");
const fs = require("node:fs");
const http = require("http");
const postgres = require("postgres");

const sql = postgres({ db: "mydb", user: "user", password: "password" });

// Define the service implementation
const service = {
  ProductsService: {
    ProductsPort: {
      CreateProduct: async function ({ name, about, price }, callback) {
        if (!name || !about || !price) {
          throw {
            Fault: {
              Code: {
                Value: "soap:Sender",
                Subcode: { value: "rpc:BadArguments" },
              },
              Reason: { Text: "Processing Error" },
              statusCode: 400,
            },
          };
        }
        try {
          const product = await sql`
          INSERT INTO products (name, about, price)
          VALUES (${name}, ${about}, ${price})
          RETURNING *
          `;

          // Will return only one element.
          callback(product[0]);
        } catch (error) {
          console.error(error);
        }
      },
      // Rajout GetProduct
      GetProduct: async function (_, callback) {
        try {
          const product = await sql`
        SELECT * 
        FROM products 
        `;
        callback(null, product);
        } catch (error) {
          console.error(error);
        }
      },
      // Rajout DeleteProduct
      DeleteProduct: async function({id}, callback) {
        try {
          const product = await sql `
          DELETE FROM products
          WHERE id = ${id}
          RETURNING *
          `;
          callback(null, product[0]);
        } catch (error) {
          console.error(error);
        }
      },
      // Rajout Patch
      PatchProduct: async function(request, callback) {
        const fields = []
        if(request.name) {
          fields.push('name')
        }
        if(request.about) {
          fields.push('about')
        }
        if(request.price) {
          fields.push('price')
        }
        try {
          const product = await sql `
          UPDATE products
          SET ${sql(request, fields)}
          WHERE id = ${request.id}
          RETURNING *
          `;
          callback(null, product[0]);
        } catch (error) {
          console.error(error);
        }
      },
    },
  },
};

// http server example
const server = http.createServer(function (request, response) {
  response.end("404: Not Found: " + request.url);
});

server.listen(8000);

// Create the SOAP server
const xml = fs.readFileSync("productsService.wsdl", "utf8");
soap.listen(server, "/products", service, xml, function () {
  console.log("SOAP server running at http://localhost:8000/products?wsdl");
});
