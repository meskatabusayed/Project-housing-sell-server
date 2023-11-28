 const express = require('express');
 const app = express();
 const cors = require('cors');
 const jwt = require('jsonwebtoken');
 require('dotenv').config();
 const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
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
    // await client.connect();



    const UserCollection = client.db('twassignDb').collection('users');
    const addCollections = client.db('twassignDb').collection('addCollection');
    const reviewCollection = client.db('twassignDb').collection('reviews');
    const wishCollection = client.db('twassignDb').collection('wishes');
    const buyCollection = client.db('twassignDb').collection('buys');

    
    // jwt related api
    app.post('/jwt' , async(req , res) => {
        const user = req.body;
        const token = jwt.sign(user , process.env.ACCESS_TOKEN_SECRET , {
            expiresIn: '9h'});
            res.send({ token });
    })

    // middlewares
    const verifyToken = (req , res , next) => {
        console.log('inside  verify token' ,  req.headers.authorization);
        if(!req.headers.authorization){
            return res.status(401).send({ message: 'forbidden access' });
        }

        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token , process.env.ACCESS_TOKEN_SECRET , (err , decoded) => {
            if(err){
                return res.status(401).send({ message: 'forbidden access' })
            }
            req.decoded = decoded;
            next();
        })


    }



    // Users Related Api

    app.get('/users' , verifyToken , async(req , res) => {
        // console.log(req.headers);
        const result = await UserCollection.find().toArray();
        res.send(result);
    })

    app.get('/users/admin/:email' , verifyToken , async(req , res) => {
        const email = req.params.email;
        if(email !== req.decoded.email){
            return res.status(403).send({ message: 'unauthorized access' })
        }
        const query = { email: email };
        const user = await UserCollection.findOne(query);
        let admin = false;
        if(user){
            admin = user?.role === 'admin'
        }
        
        res.send({ admin });

    })

    // Agent
    app.get('/users/agent/:email' , verifyToken , async(req , res) => {
        const email = req.params.email;
        if(email !== req.decoded.email){
            return res.status(403).send({ message: 'unauthorized access' })
        }
        const query = { email: email };
        const user = await UserCollection.findOne(query);
        let agent = false;
        if(user){
            agent = user?.role === 'agent'
        }
        
        res.send({ agent });

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

    app.patch('/users/agent/:id' , async(req , res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
            $set: {
                role: 'agent'
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
        // const filter = req.query;
        // console.log(filter);
        // const query = {
        //   propertyTitle:{ $regex: filter.search , $options: 'i' }
        // };
        // const options = {
        //   sort: {
        //       minPrice: filter.sort === 'asc' ? 1: -1
        //   }
        // };query , options

        const result = await addCollections.find().toArray();
        res.send(result);
    })


    app.get('/addv' , async(req , res) => {
      const filter = req.query;
      console.log(filter);
      const query = {
        propertyTitle:{ $regex: filter.search , $options: 'i' }
      };
      const options = {
        sort: {
            minPrice: filter.sort === 'asc' ? 1: -1
        }
      };

      const result = await addCollections.find(query , options).toArray();
      res.send(result);
  })


    






    // individuals Properties
    app.get('/adds' , async(req , res) => {
        let query ={};
        if(req.query?.agentEmail){
          query = { agentEmail: req.query.agentEmail}
        } 
        const result = await addCollections.find(query).toArray();
        res.send(result);
        
      })

      app.get('/adds/:id' , async(req , res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id)}
        const result = await addCollections.findOne(query);
        res.send(result);
      })

      app.patch('/adds/:id' , async(req , res) => {
        const property = req.body;
        const id = req.params.id;
        const filter = { _id: new ObjectId(id)}
        const updatedDoc = {
            $set: {
                propertyTitle: property.propertyTitle,
                propertyLocation: property.propertyLocation,
                minPrice: property.minPrice,
                maxPrice: property.maxPrice,
                propertyImage: property.propertyImage 
            }
        }

        const result = await addCollections.updateOne(filter , updatedDoc)
        res.send(result);


      })

    app.post('/add' , async(req , res) => {
        
        const item = req.body;
        const result = await addCollections.insertOne(item);
        res.send(result);
    })

    app.get('/add/:id' , async(req , res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id) };
        const result = await addCollections.findOne(query);
        res.send(result);
    })

    app.delete('/add/:id' , async(req , res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await addCollections.deleteOne(query);
        res.send(result);
    })




    // Reviews
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

      app.get('/review' , async(req , res) => {
        let query ={};
        if(req.query?.email){
          query = { email: req.query.email}
        } 
        const result = await reviewCollection.find(query).toArray();
        res.send(result);
        
      })

      app.delete('/review/:id' , async(req , res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await reviewCollection.deleteOne(query);
        res.send(result);
    })


    //   wish 
    app.post('/wishes' , async(req , res) => {
        const newWishes = req.body;
        console.log(newWishes);
        const result = await wishCollection.insertOne(newWishes);
        res.send(result);
    })

    app.get('/wish' , async(req , res) => {
        let query ={};
        if(req.query?.email){
          query = { email : req.query.email}
        } 
        const result = await wishCollection.find(query).toArray();
        res.send(result);
        
      })

      app.get('/wish/:id' , async(req , res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id) };
        const result = await wishCollection.findOne(query);
        res.send(result);
    })

    // buy

    app.get('/buys' , async(req , res) => {
        const result = await buyCollection.find().toArray();
        res.send(result);
      })


      app.get('/buy' ,  async(req , res) => {
        let query ={};
        if(req.query?.buyerEmail){
          query = { buyerEmail : req.query.buyerEmail}
        } 
        const result = await buyCollection.find(query).toArray();
        res.send(result);
        
        
      })

    //   payment
    // app.post('/create-payment-intent' , async(req , res) => {
    //     const { price } = req.body;
    //     const amount = parseInt(price * 100);
    //     console.log('amount' , amount);
    //     const paymentIntent = await stripe.paymentIntents.create({
    //         amount: amount,
    //         currency: 'usd',
    //         payment_method_types: ['card']
    //     });
    //     res.send({
    //         clientSecret: paymentIntent.client_secret
    //     })
    // })


    app.post('/buys' , async(req , res) => {
        const newBuys = req.body;
        console.log(newBuys);
        const result = await buyCollection.insertOne(newBuys);
        res.send(result);
    })


    app.patch('/buys/:id' , async(req , res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const updateDoc = req.body
        const option = {upsert: true}
        const updateValuess = {
          $set: updateDoc
  
  
        }
        const result = await buyCollection.updateOne(query , updateValuess , option)
        res.send(result)
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