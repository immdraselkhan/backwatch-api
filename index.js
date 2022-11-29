const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 8000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

// Middlewares
app.use(cors());
app.use(express.json());

// JWT verify
const verifyJWT = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token && token !== 'null') {
      jwt.verify(token, process.env.ACCESS_API_TOKEN, (error, decoded) => {
        if (error) {
          res.status(401).send({
            success: false,
            error: 'Unauthorized access, token invalid!',
          });
          return;
        } else {
          req.decoded = decoded;
          next();
        };
      });
    } else {
      res.status(401).send({
        success: false,
        error: 'Unauthorized access, token not found!',
      });
      return;
    };
  } catch (error) {
    console.error(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  };
};

// verifyAdmin
const verifyAdmin = async (req, res, next) => {
  const user = await usersCollection.findOne({ uid: req.decoded.userId });
  if (user.role === 'admin') {
    next();
  } else {
    res.status(403).send({
      success: false,
      error: 'Forbidden access!',
    });
    return;
  };
};

// verifySeller
const verifySeller = async (req, res, next) => {
  const user = await usersCollection.findOne({ uid: req.decoded.userId });
  if (user.role === 'seller') {
    next();
  } else {
    res.status(403).send({
      success: false,
      error: 'Forbidden access!',
    });
    return;
  };
};

// If MongoDB Atlast, use this server URL (Cluster)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@practice-cluster.kfbhlaq.mongodb.net/?retryWrites=true&w=majority`;

// If MongoDB Compass, use this server URL
// const uri = 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.6.0';

// Creating a new client
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// Connecting the client to the cluster then creating database
const dbConnect = async () => {
  try {
    // Connect client
    await client.connect();

    // Verify If connected, else bellow lines will not execute
    console.log('Database is connected...');

    // [USE IT TO TEST] Creating database and adding a collection then inserting a document
    // const dbTesting = client.db('dbTest').collection('collectionTest');
    // const result = await dbTesting.insertOne({'name': 'Md Rasel Khan'});
    // console.log(result);

  } catch (error) {
    console.error(error.name, error.message);
  };
};

// Execute the above function
dbConnect();

/// CREATE DATABASES

// Main database
const main = client.db('backwatch');

/// CREATE COLLECTIONS

// Users collection
const usersCollection = main.collection('users');

// Categories collection
const categoriesCollection = main.collection('categories');

// Products collection
const productsCollection = main.collection('products');

// Orders collection
const ordersCollection = main.collection('orders');

// Reports collection
const reportsCollection = main.collection('reports');

/// API ENDPOINTS

// Add a user
app.post('/add-user', async (req, res) => {
  try {
    const user = req.body;
    const result = await usersCollection.insertOne(user);
    if (result.insertedId) {
      res.send({
        success: true,
        message: 'User successfully stored!',
      });
    } else {
      res.send({
        success: false,
        error: 'Couldn\'t stored the user!',
      });
    };
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  };
});

// Get a user
app.get('/user/:uid', async (req, res) => {
  try {
    const result = await usersCollection.findOne({ uid: req.params.uid });
    if (result?.uid) {
      res.send({
        success: true,
        result,
      });
    } else {
      res.send({
        success: false,
        error: 'User not found!',
      });
    };
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  };
});

// Get all users
app.get('/users', async (req, res) => {
  try {
    const cursor = usersCollection.find({}).sort({ '_id': -1 });
    const result = await cursor.toArray();
    if (result.length > 0) {
      res.send({
        success: true,
        result,
      });
    } else {
      res.send({
        success: false,
        error: 'User not found!',
      });
    };
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  };
});

// Get all categories
app.get('/categories', async (req, res) => {
  try {
    const cursor = categoriesCollection.find({});
    const result = await cursor.toArray();
    if (result.length > 0) {
      res.send({
        success: true,
        result,
      });
    } else {
      res.send({
        success: false,
        error: 'Category not found!',
      });
    };
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  };
});

// Get all products
app.get('/products', async (req, res) => {
  try {
    const cursor = productsCollection.find({}).sort({ '_id': -1 });
    const result = await cursor.toArray();
    if (result.length > 0) {
      res.send({
        success: true,
        result,
      });
    } else {
      res.send({
        success: false,
        error: 'Product not found!',
      });
    };
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  };
});

// Get all products by user role
app.get('/products/:uid', verifyJWT, async (req, res) => {
  try {
    const user = await usersCollection.findOne({ uid: req.params.uid });
    const filter = user?.role === 'admin' ? {} : (user?.role === 'seller' ? { sellerId: req.params.uid } : false);
    const cursor = productsCollection.find(filter).sort({ '_id': -1 });
    const result = await cursor.toArray();
    if (result) {
      res.send({
        success: true,
        result,
      });
    } else {
      res.send({
        success: false,
        error: 'Something went wrong!',
      });
    };
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  };
});

// Add a product
app.post('/add-product', async (req, res) => {
  try {
    const product = req.body;
    const result = await productsCollection.insertOne(product);
    if (result.insertedId) {
      res.send({
        success: true,
        message: 'Product successfully added!',
      });
    } else {
      res.send({
        success: false,
        error: 'Couldn\'t add the product!',
      });
    };
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  };
});

// Update a product
app.patch('/update-product/:id', verifyJWT, verifySeller, async (req, res) => {
  try {
    const result = await productsCollection.updateOne({ _id: ObjectId(req.params.id) }, { $set: req.body });

    if (result.modifiedCount) {
      res.send({
        success: true,
        message: 'Product successfully updated!',
      });
    } else {
      res.send({
        success: false,
        error: 'Couldn\'t update the product!',
      });
    };
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  };
});

// Delete a product
app.delete('/delete-product/:id', verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const result = await productsCollection.deleteOne({ _id: ObjectId(req.params.id) });
    if (result.deletedCount) {
      res.send({
        success: true,
        message: 'Product successfully deleted!',
      });
    } else {
      res.send({
        success: false,
        error: 'Couldn\'t delete the product!',
      });
    };
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  };
});


// Get all sellers
app.get('/sellers', verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const cursor = usersCollection.find({ role: 'seller' });
    const result = await cursor.toArray();
    if (result) {
      res.send({
        success: true,
        result,
      });
    } else {
      res.send({
        success: false,
        error: 'Something went wrong!',
      });
    };
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  };
});

// JWT
app.post('/jwt', async (req, res) => {
  try {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_API_TOKEN, {expiresIn : '30d'});
    if (user.userId) {
      res.send({
        success: true,
        token,
      });
    } else {
      res.send({
        success: false,
        error: 'Couldn\'t generate the token!',
      });
    };
  } catch (error) {
    console.error(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  };
});

// JWT verification example
app.get('/jwt', verifyJWT, async (req, res) => {
  try {
    const decoded = req.decoded;
    if (decoded.userId !== req.params.userId) {
      res.status(401).send({
        success: false,
        error: 'Unauthorized access, different user!',
      });
      return;
    } else {
      res.send({
        success: true,
        message: 'JWT verified!',
      });
    };
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  };
});

// Verify the server is running or not
app.get('/', (req, res) => {
  try {
    res.send({
      success: true,
      message: 'Server is running...',
    });
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  };
});

// Listening the app on a particular port
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});