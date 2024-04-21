const multer = require('multer');
const path = require('path');
const session = require('express-session');
const request = require('request');

const sanitizer = require('express-sanitizer');
const { body, validationResult } = require('express-validator');



const imageFilter = function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage, fileFilter: imageFilter });
let selectedDogs = [];


module.exports = function(app, webData) {

    app.use(session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: true
    }));


    function requireLogin(req, res, next) {
        if (req.session.userId) {
            next();
        } else {
            res.redirect('login');
        }
    }

    app.get('/weather', (req, res) => {
        const dataWithLoggedIn = { ...webData, loggedIn: req.session.loggedIn };
        res.render('weather.ejs', dataWithLoggedIn);
    });
    
    // Handle the weather form submission
    app.post('/weather', (req, res) => {
        const apiKey = '697d17242610b50501f7f3360c501584';
        const city = req.body.city; // Get the city name from the form
    
        if (!city) {
            return res.status(400).send('City name is required');
        }
    
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    
        // Make an HTTP request to the OpenWeatherMap API
        request(apiUrl, { json: true }, (error, response, body) => {
            if (error) {
                console.error('Error fetching weather data:', error.message);
                res.status(500).send('Error fetching weather data');
            } else {
                const weatherData = {
                    description: body.weather[0].description,
                    temperature: body.main.temp
                };
    
                const dataWithLoggedIn = { ...webData, loggedIn: req.session.loggedIn, weatherData };
                res.render('chosenweather.ejs', dataWithLoggedIn);
            }
        });
    });

    
    app.get('/', (req, res) => {
        let sqlquery = "SELECT * FROM dogs WHERE adopt = 1"; // Filter dogs with adopt = true
        db.query(sqlquery, (err, result) => {
          if (err) {
            console.error('Error retrieving dogs:', err);
            // Instead of 500 Internal Server Error, respond with 200 OK and an error message
            return res.status(200).send('Error retrieving dogs. Please try again.'); 
          }
      
          const newData = {
            webData,
            availableDogs: result,
            selectedDogs: [], // Assuming selectedDogs is defined elsewhere
            loggedIn: req.session.loggedIn  // You can keep this if you need it for rendering purposes
          };
      
          res.render('index.ejs', newData);
        });
      });

    app.get('/adoption', function(req, res) {
        const dataWithLoggedIn = { ...webData, loggedIn: req.session.loggedIn };
    
        res.render('adoption.ejs', dataWithLoggedIn);
    });

    app.get('/fostering', function(req, res) {
        const dataWithLoggedIn = { ...webData, loggedIn: req.session.loggedIn };
    
        res.render('fostering.ejs', dataWithLoggedIn);
    });


    app.get('/adoptdog', function(req, res) {
        let sqlquery = "SELECT * FROM dogs WHERE adopt = 1"; // Filter dogs with adopt = true
        db.query(sqlquery, (err, result) => {
            if (err) {
                console.error('Error retrieving dogs:', err);
                return res.redirect('/');
            }
    
            const newData = {
                ...webData,
                availableDogs: result,
                selectedDogs: selectedDogs,
                loggedIn: req.session.loggedIn
            };
    
            console.log(newData);
            console.log("Item Paths:", newData.availableDogs.map(item => item.image_path));
            res.render("adoptdog.ejs", newData);
        });
    });

    app.get('/fosterdog', function(req, res) {
        let sqlquery = "SELECT * FROM dogs WHERE foster = 1"; // Filter dogs with foster = true
        db.query(sqlquery, (err, result) => {
            if (err) {
                console.error('Error retrieving dogs:', err);
                return res.redirect('/');
            }
    
            const newData = {
                ...webData,
                availableDogs: result,
                selectedDogs: selectedDogs,
                loggedIn: req.session.loggedIn
            };
    
            console.log(newData);
            console.log("Item Paths:", newData.availableDogs.map(item => item.image_path));
            res.render("fosterdog.ejs", newData);
        });
    });

    app.get('/contact', function(req, res) {
        const dataWithLoggedIn = { ...webData, loggedIn: req.session.loggedIn };
    
        res.render('contact.ejs', dataWithLoggedIn);
    });

    app.get('/posts', function(req, res) {
        let sqlQuery = `
            SELECT posts.*, users.username AS addedByUsername, dogs.id AS dogId
            FROM posts
            JOIN users ON posts.UserId = users.UserId
            JOIN dogs ON posts.dogId = dogs.id
        `;
    
        db.query(sqlQuery, (err, result) => {
            if (err) {
                console.error('Error retrieving posts:', err);
                return res.redirect('/');
            }
    
            console.log('Retrieved posts:', result);
    
            // Prepare template data and render the 'posts.ejs' template
            const postsData = result.map(post => ({
                name: post.name,
                image_path: post.image_path,
                post_content: post.post_content,
                addedByUsername: post.addedByUsername,
                dogId: post.dogId // Include dogId in template data
            }));
    
            const templateData = {
                posts: postsData,
                loggedIn: req.session.loggedIn
    
            };
    
            res.render("posts.ejs", templateData);
        });
    });

    app.get('/search', function(req, res) {
        const dataWithLoggedIn = { ...webData, loggedIn: req.session.loggedIn };
        res.render("search.ejs", dataWithLoggedIn);
    });
   // app.get('/search-result', function (req, res) {
        //searching in the database
      //  res.send("You searched for: " + req.query.keyword);
  //  });
    app.get('/register', function (req,res) {
        const dataWithLoggedIn = { ...webData, loggedIn: req.session.loggedIn };
        res.render("register.ejs", dataWithLoggedIn);                                                                     
    });                                                                                                 
    app.post('/registered', [
        // Validation rules
        body('username').notEmpty().trim().escape(),
        body('first').notEmpty().trim().escape(),
        body('last').notEmpty().trim().escape(),
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty().trim().escape(),
    
    ], (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        const sanitizedUsername = req.sanitize(req.body.username);
        const sanitizedFirst = req.sanitize(req.body.first);
        const sanitizedLast = req.sanitize(req.body.last);
        const sanitizedEmail = req.sanitize(req.body.email);
        const sanitizedPassword = req.sanitize(req.body.password);
    
        // Continue with registration logic
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const plainPassword = req.body.password;
    
        bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
            if (err) {
                return res.status(500).send('An error occurred during password hashing.');
            }
    
            // Store hashed password in the database
            const sqlquery = "INSERT INTO users (username, first, last, email, hashedPassword) VALUES (?,?,?,?,?)";
            const newrecord = [req.body.username, req.body.first, req.body.last, req.body.email, hashedPassword];
    
            db.query(sqlquery, newrecord, (err, result) => {
                if (err) {
                    return res.status(500).send('An error occurred during database insertion.');
                }
    
                res.redirect('login');
            });
        });
    });
    app.get('/login', function (req, res) {
        const dataWithLoggedIn = { ...webData, loggedIn: req.session.loggedIn };
        res.render('login.ejs', dataWithLoggedIn);
    });
    app.post('/loggedin', function (req, res) {
        const bcrypt = require('bcrypt');
    
        let username = req.body.username;
        let password = req.body.password;
    
        // Retrieve the hashed password and userId from the database based on the username
        let sqlquery = 'SELECT userId, hashedPassword FROM users WHERE username=?';
        db.query(sqlquery, [username], function (err, rows) {
            if (err) {
                // Log the error details
                console.error('Error retrieving user data:', err);
                res.status(500).send('An error occurred while retrieving the user data.');
            } else if (rows.length === 0) {
                res.status(401).send('No user found with that username.');
            } else {
                const hashedPassword = rows[0].hashedPassword;
    
                // Compare the user's password with the hashed password from the database
                bcrypt.compare(password, hashedPassword, function (err, result) {
                    if (err) {
                        console.error('Error comparing passwords:', err);
                        res.status(500).send('An error occurred while comparing passwords.');
                    } else if (result === true) {
                        // Set the user as logged in and store userId in the session
                        req.session.loggedIn = true;
                        req.session.userId = rows[0].userId;
    
                        // Redirect to the basket
                        res.redirect('/');
                    } else {
                        res.status(401).send('Incorrect password.');
                    }
                });
            }
        });
    });
    
    
    app.get('/listusers', function(req, res) {
        let sqlquery = "SELECT * FROM users"; 
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = { ...webData, users: result, loggedIn: req.session.loggedIn };
            console.log(newData)
            res.render("listusers.ejs", newData);
        });
    });
    app.get('/addDog', requireLogin, function (req, res) {
        const dataWithLoggedIn = { ...webData, loggedIn: req.session.loggedIn };
        res.render('addDog.ejs', dataWithLoggedIn);
    });      
    
    app.get('/addpost', requireLogin, function (req, res) {
        const dataWithLoggedIn = { ...webData, loggedIn: req.session.loggedIn };
        res.render('addpost.ejs', dataWithLoggedIn);
    });  
    
    app.post('/dogadded', upload.single('image'), function (req, res) {
        const imagePath = req.file ? req.file.path.replace(/\\/g, '/').replace('public/', '') : null;
        const userId = req.session.userId; 
    
        const adopt = req.body.adopt === 'true';
        const foster = req.body.foster === 'true';
    
        // Determine the action URL based on the adopt and foster values
        let actionUrl = '';
        if (adopt && foster) {
            actionUrl = '/fosterdog';
        } else if (adopt) {
            actionUrl = '/adoptdog';
        } else {
            actionUrl = '/';
        }
    
        let sqlquery = "INSERT INTO dogs (name, breed, age, image_path, description, location, adopt, foster, UserId) VALUES (?,?,?,?,?,?,?,?,?)";
        let newrecord = [req.body.name, req.body.breed, req.body.age, imagePath, req.body.description, req.body.location, adopt, foster, userId];
    
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }
    
            res.send(`
                <p>Dog added to the database:</p>
                <p>Name: ${req.body.name}</p>
                <p>Breed: ${req.body.breed}</p>
                <p>Age: ${req.body.age}</p>
                <p>Image: ${imagePath ? imagePath : 'No image uploaded'}</p>
                <p>Description: ${req.body.description}</p>
                <p>Location: ${req.body.location}</p>
                <p>Adopt: ${adopt}</p>
                <p>Foster: ${foster}</p>
                <form action="${actionUrl}" method="get">
                    <button type="submit">Confirm</button>
                </form>
            `);
        });
    });

    app.post('/postadded', upload.single('image'), function (req, res) {
        const imagePath = req.file ? req.file.path.replace(/\\/g, '/').replace('public/', '') : null;
        const userId = req.session.userId;
    
        const dogName = req.body.name; // Assuming 'name' from the form corresponds to the dog's name
        const postContent = req.body.post_content;
    
        // Find the dog by name to get its ID (assuming dog names are unique)
        const sqlQueryFindDog = 'SELECT id FROM dogs WHERE name = ?';
        db.query(sqlQueryFindDog, [dogName], (err, dogResult) => {
            if (err) {
                console.error('Error finding dog:', err);
                return res.status(500).send('Internal Server Error');
            }
    
            if (dogResult.length === 0) {
                return res.status(404).send('Dog not found');
            }
    
            const dogId = dogResult[0].id;
    
            // Insert the post into the posts table using the retrieved dogId
            const sqlQueryInsertPost = "INSERT INTO posts (name, post_date, image_path, post_content, UserId, dogId) VALUES (?, NOW(), ?, ?, ?, ?)";
            const newRecord = [dogName, imagePath, postContent, userId, dogId];
    
            db.query(sqlQueryInsertPost, newRecord, (err, result) => {
                if (err) {
                    console.error('Error inserting post:', err);
                    return res.status(500).send('Internal Server Error');
                }
    
                // Fetch the dog details from the database based on the inserted post's dogId
                const sqlQueryFetchDog = 'SELECT * FROM dogs WHERE id = ?';
                db.query(sqlQueryFetchDog, [dogId], (err, dogResult) => {
                    if (err) {
                        console.error('Error retrieving dog details:', err);
                        return res.status(500).send('Internal Server Error');
                    }
    
                    if (dogResult.length === 0) {
                        return res.status(404).send('Dog not found');
                    }
    
                    const dog = dogResult[0];
                    const data = {
                        dog: dog,
                        imagePath: imagePath,
                        loggedIn: req.session.loggedIn || false
                    };
    
                    // Render the 'dogDetails.ejs' template with the prepared data
                    res.render('dogDetails.ejs', data);
                });
            });
        });
    });
    
    app.get('/search-result', function (req, res) {
        let sqlquery = `SELECT * FROM dogs WHERE name LIKE "%${req.query.keyword}%"`;
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = { ...webData, availableDogs: result, loggedIn: req.session.loggedIn };
            console.log(newData);
            res.render("search-result.ejs", newData);
        });
    });
     
    
   
    app.get('/logout', function (req, res) {
        req.session.destroy(function(err) {
            if (err) {
                console.error('Error logging out:', err);
            }
            // Redirect to the home page after logout
            res.redirect('/');
        });
    });

    app.get('/dogs/:id', (req, res) => {
        const dogId = req.params.id;
    
        // Fetch dog details from the database based on the ID
        const sqlQuery = 'SELECT * FROM dogs WHERE id = ?';
        db.query(sqlQuery, [dogId], (err, result) => {
            if (err) {
                console.error('Error retrieving dog details:', err);
                return res.status(500).send('Internal Server Error');
            }
    
            if (result.length === 0) {
                return res.status(404).send('Dog not found');
            }
    
            const dog = result[0];
    
            // Define imagePath based on dog's image_path (replace 'public/' if present)
            const imagePath = dog.image_path ? dog.image_path.replace(/\\/g, '/').replace('public/', '') : null;
        
    
            // Determine loggedIn status
            const loggedIn = req.session.loggedIn || false;
    
            // Include webData and loggedIn status in the template data
            const dataWithLoggedIn = { ...webData, loggedIn: loggedIn };
    
            // Prepare the data object to pass to the template
            const data = {
                dog: dog,
                imagePath: imagePath,
                loggedIn: loggedIn, // Pass loggedIn status to the template
                webData: dataWithLoggedIn // Include webData with loggedIn status
            };
    
            // Render the 'dogDetails.ejs' template with the prepared data
            res.render('dogDetails.ejs', data);
        });
    });

    app.post('/submit', function(req, res) {
        const { first_name, last_name, email, reason, dog, query } = req.body;
      
        // Logging request body for debugging
        console.log('Received form submission:', req.body);
      
        // Validate required fields
        if (!first_name || !last_name || !email || !reason) {
          console.log('Missing required fields:', { first_name, last_name, email, reason });
          return res.status(400).send('Missing required fields');
        }
      
        // Handle reason-specific field validation
        let finalDog = null;
        let finalQuery = null;
      
        if (reason === 'adoption' || reason === 'fostering') {
          if (!dog) {
            console.log('Dog name is required for adoption or fostering');
            return res.status(400).send('Dog name is required for adoption or fostering');
          }
          finalDog = dog;
        } else if (reason === 'question') {
          if (!query) {
            console.log('Query is required for other queries');
            return res.status(400).send('Query is required for other queries');
          }
          finalQuery = query;
        } else {
          console.log('Invalid reason provided:', reason);
          return res.status(400).send('Invalid reason provided');
        }
      
        // Insert form data into the database
        const sqlQuery = `
          INSERT INTO queries (first_name, last_name, email, reason, dog, query)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const queryValues = [first_name, last_name, email, reason, finalDog, finalQuery];
      
        db.query(sqlQuery, queryValues, (err, result) => {
          if (err) {
            console.error('Error submitting query:', err);
            return res.status(500).send('Internal Server Error');
          }
      
          console.log('Form submission successful:', result);
          res.redirect('/submission-confirmation');
        });
      });
      

    app.get('/queries', function(req, res) {
        // Check if the user is authenticated
        const loggedIn = req.session.loggedIn;
    
        if (!loggedIn) {
            return res.redirect('/login'); // Redirect to login if not logged in
        }
    
        // Fetch queries from the database
        let sqlQuery = `SELECT * FROM queries`;
    
        db.query(sqlQuery, (err, result) => {
            if (err) {
                console.error('Error retrieving queries:', err);
                return res.status(500).send('Internal Server Error');
            }
    
            const queries = result;
    
            // Render a view template with the retrieved queries and loggedIn status
            res.render('queries.ejs', { queries, loggedIn });
        });
    });

    // Define a route for the submission confirmation page
    app.get('/submission-confirmation', function (req,res) {
        const dataWithLoggedIn = { ...webData, loggedIn: req.session.loggedIn };
        res.render("submission-confirmation.ejs", dataWithLoggedIn);                                                                     
    });

    app.post('/updateQuery', function(req, res) {
        const { queryId, status, comments } = req.body;
    
        // Update the query in the database with new status and comments
        let sqlQuery = `UPDATE queries SET status = ?, comments = ? WHERE id = ?`;
        db.query(sqlQuery, [status, comments, queryId], (err, result) => {
            if (err) {
                console.error('Error updating query:', err);
                return res.status(500).send('Internal Server Error');
            }
    
            res.redirect('/queries');
        });
    });

    app.post('/editDog/:id', (req, res) => {
        const dogId = req.params.id;
        const { name, breed, age, location, description } = req.body;
    
        // Update the dog details in the database
        const sqlQuery = 'UPDATE dogs SET name = ?, breed = ?, age = ?,location = ?, description = ? WHERE id = ?';
        db.query(sqlQuery, [name, breed, age, location, description, dogId], (err, result) => {
            if (err) {
                console.error('Error updating dog details:', err);
                return res.status(500).send('Internal Server Error');
            }
    
            // Redirect to the updated dog's details page
            res.redirect(`/dogs/${dogId}`);
        });
    });
    





    
}
