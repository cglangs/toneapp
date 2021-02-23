const express = require('express')
const bodyParser = require('body-parser')
const {ApolloServer, gql} = require('apollo-server-express')
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { ACCESS_SECRET, REFRESH_SECRET, getUserId } = require('./utils')
const app = express();

mongoose.connect('mongodb://localhost/tone_db', {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
  user_name: String,
  user_password: String,
  user_email: String,
  user_role: String
});

const User = mongoose.model('User', userSchema);


async function signup(object, params, ctx, resolveInfo) {
  params.password = await bcrypt.hash(params.user_password, 10)
  const newUser = new User({ user_name: params.user_name, user_email: params.user_email, user_password: params.password, user_role: params.user_role })
  var user
  
  try{
  	user = await newUser.save()
  	//const token = jwt.sign({ userId: user._id, role: user.user_role }, ACCESS_SECRET)
  	ctx.req.res.cookie("refresh-token", jwt.sign({ userId: user._id, role: user.user_role }, REFRESH_SECRET), { maxAge: 24 * 60 * 60 * 1000})
    ctx.req.res.cookie("access-token", jwt.sign({ userId: user._id, role: user.user_role }, ACCESS_SECRET), { maxAge: 15 * 60 * 1000 })
    return user
  }  
  catch(error){
  	console.log(error)
    throw new Error("Email address already in use")
  }
}

async function login(object, params, ctx, resolveInfo) {
  const password = params.user_password
  delete params.user_password

  const user =  await User.findOne({ user_email: params.user_email }).exec();

  if (!user) {
    throw new Error('No such user found')
  }
  const valid = await bcrypt.compare(password, user.user_password)
  if (!valid) {
    throw new Error('Invalid password')
  }
  user.user_password = null
  ctx.req.res.cookie("refresh-token", jwt.sign({ userId: user._id, role: user.user_role }, REFRESH_SECRET), { maxAge: 24 * 60 * 60 * 1000})
  ctx.req.res.cookie("access-token", jwt.sign({ userId: user._id, role: user.user_role }, ACCESS_SECRET), { maxAge: 15 * 60 * 1000 })
  //const token = jwt.sign({ userId: user._id, role: user.user_role }, ACCESS_SECRET)
  return user
}


async function getMe(object, params, ctx, resolveInfo) {
  console.log(params)
  const user =  await User.findById(params.user_id)

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
  	_id: String
  	user_name: String
  	user_email: String
  	user_password: String
  	user_role: String
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


app.use(cors(corsOptions));

app.use(cookieParser())

app.use((req, res, next) =>{

  const refreshToken = req.cookies["refresh-token"];
  const accessToken = req.cookies["access-token"];
  //no token
  if (!refreshToken && !accessToken) {
    return next();
  }

  if(accessToken){
    const user = jwt.verify(accessToken, ACCESS_SECRET)
    req.userId = user.userId
    return next()
  }

  let refreshUserData;

  try {
    refreshUserData = jwt.verify(refreshToken, REFRESH_SECRET);
  } catch {
    //no access token, and refresh token error
    return next();
  }

  //no access token, but there is a refresh token
  res.cookie("refresh-token", jwt.sign({ userId: refreshUserData.userId, role: refreshUserData.role }, REFRESH_SECRET), { maxAge:  10 * 24 * 60 * 60 * 1000 })
  res.cookie("access-token", jwt.sign({ userId: refreshUserData.userId, role: refreshUserData.role }, ACCESS_SECRET), { maxAge: 15 * 60 * 1000 })
  req.userId = refreshUserData.userId;
  next();
})

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

const port = process.env.PORT || 3003;
server.applyMiddleware({ app });
//server.applyMiddleware({ app, cors: corsOptions });

app.listen({ port: port }, () =>
  console.log(`GraphQL API ready at http://localhost:${port}`)
);