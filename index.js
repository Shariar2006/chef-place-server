const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000

//middle ware 
app.use(cors());
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.llvdprw.mongodb.net/?retryWrites=true&w=majority`;

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
        //DB collection
        const menuCollection = client.db('chef-place').collection('allMeals')
        const userCollection = client.db('chef-place').collection('user')
        const cartCollection = client.db('chef-place').collection('cart')
        const reviewCollection = client.db('chef-place').collection('review')


        //middleware 
        const verifyToken = (req,res,next)=>{
            if(!req.headers.authorization){
                return res.status(401).send({ message: 'forbidden access' })
            }
            const token = req.headers.authorization.split(' ')[1]
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decode)=>{
                if(error){
                    return res.status(401).send({ message: 'forbidden access' })
                }
                req.decode = decode
                next()
            })
        }


        //jwt token
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send(token)
        })

        //all meals
        app.get('/allMeals',  async (req, res) => {
            const result = await menuCollection.find().toArray()
            res.send(result)
        })

        //single meal
        app.get('/meal/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await menuCollection.findOne(query)
            res.send(result)
        })

        //user info
        app.post('/users', async (req, res) => {
            const user = req.body
            const query = { email: user.email };
            const existingUser = await userCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: 'user already exists' })
            }
            const result = await userCollection.insertOne(user)
            res.send(result)
        })

        app.get('/allUsers', verifyToken, async(req,res)=>{
            const result = await userCollection.find().toArray()
            res.send(result)
        })

        //check admin
        app.get('/user/admin/:email', verifyToken, async(req, res)=>{
            const email = req.params.email;
            if(email !== req.decode.email){
                return res.status(403).send({message: 'unauthorize access'})
            }

            const query = {email: email}
            const user = await userCollection.findOne(query)
            let admin = false;
            if(user){
                admin = user?.role === 'admin'
            }
            res.send({admin})
        })

        app.delete('/users/:id', async(req, res)=>{
            const id = req.params.id
            const query = {_id: new ObjectId(id)}
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })

        //make admin
        app.patch('/users/:id', async(req, res)=>{
            const id = req.params.id
            const filter = {_id: new ObjectId(id)}
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        //single user
        app.get('/user',  async (req, res) => {
            const email = req.query.email;
            const query = {email: email}
            const result = await userCollection.find(query).toArray()
            res.send(result)
        })


        //add to cart 
        app.post('/carts', async (req, res) => {
            const cartItem = req.body;
            const result = await cartCollection.insertOne(cartItem)
            res.send(result)
        })

        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await cartCollection.find(query).toArray()
            res.send(result)
        })

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartCollection.deleteOne(query)
            res.send(result)
        })

        //add a review 
        app.post('/review', async (req, res) => {
            const cartItem = req.body;
            const result = await reviewCollection.insertOne(cartItem)
            res.send(result)
        })

        app.get('/review', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await reviewCollection.find(query).toArray()
            res.send(result)
        })

        app.patch('/review/:id', async(req, res)=>{
            const item = req.body;
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)};
            const updateDoc = {
                $set:{
                    review: item.review
                }
            }
            const result = await reviewCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.delete('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await reviewCollection.deleteOne(query)
            res.send(result)
        })


        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('chef place server is running')
})

app.listen(port, () => { })