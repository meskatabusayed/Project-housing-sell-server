 const express = require('express');
 const app = express();
 const cors = require('cors');
 require('dotenv').config()
 const { MongoClient, ObjectId , ServerApiVersion } = require('mongodb');
 const port = process.env.PORT || 5000;


//  middleware
app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fohhaen.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();



    const UserCollection = client.db('twassignDb').collection('users');
    const addCollections = client.db('twassignDb').collection('addCollection');
    const reviewCollection = client.db('twassignDb').collection('reviews');

    // Users Related Api

    app.get('/users' , async(req , res) => {
        const result = await UserCollection.find().toArray();
        res.send(result);
    })


    app.post('/users' , async(req , res) => {
        const user = req.body;
        const query = { email: user.email }
        const existingUser = await UserCollection.findOne(query);
        if(existingUser){
            return res.send({ message: 'user Already Exists' , insertedId: null })
        }
        const result = await UserCollection.insertOne(user);
        res.send(result);



    })

    app.patch('/users/admin/:id' , async(req , res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
            $set: {
                role: 'admin'
            }
        }
        const result = await UserCollection.updateOne(filter , updatedDoc)
        res.send(result);
    })

    app.delete('/users/:id' , async(req , res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await UserCollection.deleteOne(query);
        res.send(result);
    })



    // Add related Ali
    app.get('/add' , async(req , res) => {
        const result = await addCollections.find().toArray();
        res.send(result);
    })

    app.get('/add/:id' , async(req , res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id) };
        const result = await addCollections.findOne(query);
        res.send(result);
    })


    app.post('/reviews' , async(req , res) => {
        const newReview = req.body;
        console.log(newReview);
        const result = await reviewCollection.insertOne(newReview);
        res.send(result);
    })

      app.get('/reviews' , async(req , res) => {
        const result = await reviewCollection.find().toArray();
        res.send(result);
      })

    //   app.get('/reviews/:propertyTitle' , async(req , res) => {
    //     const propertyTitle = req.params.propertyTitle;
    //     const query = {propertyTitle : propertyTitle};
    //     const cursor = reviewCollection.find(query);
    //     const result = await cursor.toArray();
    //     res.send(result);
    // })
    
       





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/' , (req , res) => {
    res.send('Assignment 12 is running')
})

app.listen(port , () => {
    console.log(`Assignment 12 is Running on port ${port}`);
})