const express = require('express')
const bodyParser = require('body-parser')
const {ApolloServer, gql} = require('apollo-server-express')
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { ACCESS_SECRET, REFRESH_SECRET, getUserId } = require('./utils')
const app = express();

mongoose.connect('mongodb://localhost/tone_db', {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
  user_name: String,
  password: String,
  email: String,
  role: String
});

const User = mongoose.model('User', userSchema);


async function signup(object, params, ctx, resolveInfo) {
  params.password = await bcrypt.hash(params.user_password, 10)
  const newUser = new User({ user_name: params.user_name, email: params.user_email, password: params.user_password, role: params.user_role })
  var user
  
  try{
  	user = await newUser.save()
  	const token = jwt.sign({ userId: user._id, role: user.user_role }, ACCESS_SECRET)
    return {user, token}
  }  
  catch(error){
  	console.log(error)
    throw new Error("Email address already in use")
  }
}

async function login(object, params, ctx, resolveInfo) {
  const password = params.user_password
  delete params.user_password

  const user =  await User.findOne({ email: params.user_email }).exec();

  if (!user) {
    throw new Error('No such user found')
  }
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    throw new Error('Invalid password')
  }
  user.user_password = null
  const token = jwt.sign({ userId: user._id, role: user.user_role }, ACCESS_SECRET)
  return {user, token}
}


async function getMe(object, params, ctx, resolveInfo) {
  const user =  await User.find( { _id: { $eq: params.userId } } )

  if (!user) {
    throw new Error('Error')
  }

  return user
}


const schema = gql`
  type Mutation {
  	CreateUser(user_name: String! user_email: String! user_password: String! user_role: String! = "STUDENT"): User
  	Login(user_email: String! user_password: String!): User
  }

  type Query {
  	me: User
  }
 
  type User {
  	_id: String!
  	user_name: String!
  	user_email: String!
  	user_password: String!
  	user_role: String!
  }


`

const resolvers = {
   Mutation: {
   	CreateUser(object, params, ctx, resolveInfo) {
   		return signup(object, params, ctx, resolveInfo) 
   	},
   	Login(object, params, ctx, resolveInfo) {
   		return login(object, params, ctx, resolveInfo) 
   	}
   },
  Query: {
    me(object, params, ctx, resolveInfo){
        var user
        if(ctx.req.userId){
            params.user_id = ctx.req.userId
            user = getMe(object, params, ctx, resolveInfo)
        }

        return user
    }
  }
 }

var corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
};


const server = new ApolloServer({
  introspection: true,
  playground: true,
  typeDefs: schema,
  resolvers,
  context: ({ req }) => {
    return {
      req
    };
  }
});


server.applyMiddleware({ app, cors: corsOptions });


const port = process.env.PORT || 3003;

app.listen({ port: port }, () =>
  console.log(`GraphQL API ready at http://localhost:${port}`)
);