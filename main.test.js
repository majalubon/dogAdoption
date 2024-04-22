const { performance } = require('perf_hooks');
const request = require("supertest");
const app = require('./index');
const mysql = require("mysql"); // Import the main module (assuming this is where your app setup is exported)

// Mock database and other dependencies if needed
test("test database connection", (done) => {
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'appuser',
    password: 'qwerty',
    database: 'dogAdoption'
  });
  db.connect((err) => {
    if (err) {
      done(err);
      return;
    }
    console.log("Connected to database");
    global.db = db;
    done();
  });
});


describe("./", function () {
  let server;

  beforeAll(async () => {
    server = await new Promise((resolve, reject) => {
      const s = app.listen(0, (err) => {
        if (err) {
          return reject(err);
        }
        resolve(s);
      });
    });
  });

  afterAll(async () => {
    await server.close();
  });

  it("responds with status 200", function (done) {
    request(app)
      .get("/")
      .expect(200, done);
  });
}); 

beforeAll(async () => {
  server = app.listen(0, () => {   
    const address = server.address();
    console.log(`Server listening on port ${address.port}`);
  });
});


test('index.js loads within 500ms', () => {
  const start = performance.now();
  // Load index.js
  app.listen(8000, () => {
    const end = performance.now();
    const loadTime = end - start;
    expect(loadTime).toBeLessThan(500);
  });
});


test("should allow access to /adoptdog page without logging in", async () => {
  const res = await request(app).get("/adoptdog");
  expect(res.statusCode).toEqual(200);
}); 
test("should allow access to /fosterdog page without logging in", async () => {
  const res = await request(app).get("/fosterdog");
  expect(res.statusCode).toEqual(200);
}); 
test("should allow access to /adoption page without logging in", async () => {
  const res = await request(app).get("/adoption");
  expect(res.statusCode).toEqual(200);
}); 
test("should allow access to /fostering page without logging in", async () => {
  const res = await request(app).get("/fostering");
  expect(res.statusCode).toEqual(200);
}); 
test("should allow access to /contact page without logging in", async () => {
  const res = await request(app).get("/contact");
  expect(res.statusCode).toEqual(200);
}); 
test("should allow access to /posts page without logging in", async () => {
  const res = await request(app).get("/posts");
  expect(res.statusCode).toEqual(200);
}); 



describe('addpost', () => {
  it('if user types in URL addpost it should redirect to /login', async () => {
    const response = await request(app)
      .get('/addpost')
      .set('Accept', 'text/html');

    expect(response.status).toBe(302);
    expect(response.header.location).toBe('login');
  });
});

describe('addDog', () => {
  it('if user types in URL addpost it should redirect to /login', async () => {
    const response = await request(app)
      .get('/addDog')
      .set('Accept', 'text/html');

    expect(response.status).toBe(302);
    expect(response.header.location).toBe('login');
  });
});

describe('queries', () => {
  it('if user types in URL addpost it should redirect to /login', async () => {
    const response = await request(app)
      .get('/queries')
      .set('Accept', 'text/html');

    expect(response.status).toBe(302);
    expect(response.header.location).toBe('/login');
  });
});

describe('/adoptdog', () => {
  test('responds with status 200 and shows dogs', async () => {
    const response = await request(app).get('/adoptdog');
    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('Dogs available for adoption'); 
  });
});

describe('/fosterdog', () => {
  test('responds with status 200 and shows dogs', async () => {
    const response = await request(app).get('/fosterdog');
    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('Dogs available for fostering'); // Assuming this text is present in the HTML when dogs are shown
    // You can add more specific assertions based on your HTML structure
  });
});

describe('/posts', () => {
  test('responds with status 200 and shows posts', async () => {
    const response = await request(app).get('/posts');
    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('Our Posts'); // Assuming this text is present in the HTML when posts are shown
    // You can add more specific assertions based on your HTML structure
  });
});


test('/dogadded redirects unauthorised users to login page', async () => {
  const response = await request(app)
    .post('/dogadded')
    .field('name', 'Testdog1234')
    .field('breed', 'Labrador Retriever')
    .field('age', '3')
    .field('description', 'Friendly and playful dog')
    .field('location', 'City')
    .field('adopt', 'true')
    .attach('image', 'public/images/1712784793658.jpg'); 

  expect(response.statusCode).toBe(302);
  expect(response.headers.location).toBe('/login');
});


describe('Registered user adding a dog', () => {
  let agent = request.agent(app); 

  beforeAll(async () => {
    await agent
      .post('/registered')
      .send({
        username: 'testUser',
        first: 'Test',
        last: 'User',
        email: 'test@example.com',
        password: 'Testpassword1'
      });
  });

  it('allows registered user to login', async () => {
    const response = await agent
      .post('/loggedin')
      .send({ username: 'testUser', password: 'Testpassword1' });

    expect(response.statusCode).toBe(302); 
    expect(response.headers.location).toBe('/'); 
  });

  it('allows logged in user to add a dog', async () => {
    const response = await agent
      .post('/dogadded')
      .field('name', 'test1234567')
      .field('breed', 'Golden Retriever')
      .field('age', '2')
      .field('description', 'Playful and friendly')
      .field('location', 'New York')
      .field('adopt', 'true')
      .field('foster', 'false')
      .attach('image', 'public/images/1712784793658.jpg'); 

    expect(response.statusCode).toBe(200); 
    expect(response.text).toContain('Dog added to the database'); 
  });
});


test('/postadded redirects unauthorised users to login page', async () => {
  const response = await request(app)
    .post('/postadded')
    .field('name', 'Lola')
    .attach('image', 'public/images/1712784793658.jpg')
    .field('post_content', 'Labrador Retriever'); 

  expect(response.statusCode).toBe(302);
  expect(response.headers.location).toBe('/login');
});



describe('Registered user adding a post', () => {
  let agent = request.agent(app); // Create an agent to maintain the session

  beforeAll(async () => {
    // Register a user
    await agent
      .post('/registered')
      .send({
        username: 'testUser',
        first: 'Test',
        last: 'User',
        email: 'test@example.com',
        password: 'Testpassword1'
      });
  });

  it('allows registered user to login', async () => {
    // Login with the registered user
    const response = await agent
      .post('/loggedin')
      .send({ username: 'testUser', password: 'Testpassword1' });

    expect(response.statusCode).toBe(302); // Expecting a redirect status code
    expect(response.headers.location).toBe('/'); // Expecting redirection to the home page
  });

  it('allows logged in user to add a post', async () => {
    // Add a dog after successful login
    const response = await agent
      .post('/postadded')
      .field('name', 'Lola')
      .attach('image', 'public/images/1712784793658.jpg')
      .field('post_content', 'Labrador Retriever'); 

    expect(response.statusCode).toBe(200); // Expecting a success status code
  });
});











/* test('POST /postadded › redirects unauthorized user to login page', async () => {
  // Make a POST request to /postadded without logging in
  const response = await request(app)
    .post('/postadded')
    .field('name', 'Test Dog')
    .field('post_content', 'Test post content')
    .attach('image', 'public/images/1712784793658.jpg'); // Provide a path to a test image

  // Expecting a redirect status code (302) because the user is unauthorized
  expect(response.statusCode).toBe(302);
  // Expecting redirection to the login page
  expect(response.headers.location).toBe('/login');
});

test('Registered user adding a post › allows logged-in user to add a post', async () => {
  // Register a new user (assuming registration functionality is already tested)
  // Login as the registered user
  const agent = request.agent(app); // Create an agent to persist cookies across requests
  await agent
    .post('/loggedin')
    .send({ username: 'testUser', password: 'Testpassword1' }); // Provide registered user credentials

  // Make a POST request to /postadded as the logged-in user
  const response = await agent
    .post('/postadded')
    .field('name', 'Test Dog')
    .field('post_content', 'Test post content')
    .attach('image', 'public/images/1712784793658.jpg'); // Provide a path to a test image

  // Expecting a success status code (200) because the user is logged in and authorized
  expect(response.statusCode).toBe(200);
  // Expecting success message
}); */