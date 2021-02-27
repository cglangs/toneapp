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

const phraseSchema = new mongoose.Schema({
  	phrase_order: Number,
  	full_phrase: String,
  	phrase_no_punctuation: String,
  	word_list: [String],
  	pinyin: [String],
    pinyin_no_tones: [String],
  	written_tones: [String],
  	spoken_tones: [String]
});

const Phrase = mongoose.model('Phrase', phraseSchema);

const deckSchema = new mongoose.Schema({
  deck_id: Number,
  deck_name: String
});

const Deck = mongoose.model('Deck', deckSchema);


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

async function getPhraseByDeckIdPhraseOrder(object, params, ctx, resolveInfo) {
  const phrase =  await Phrase.findOne({ deck_id: params.deck_id , phrase_order: params.phrase_order})

  if (!phrase) {
    throw new Error('Error')
  }

  return phrase

}

async function getMe(object, params, ctx, resolveInfo) {
  const user =  await User.findById(params.user_id)

  if (!user) {
    throw new Error('Error')
  }

  return user
}

async function getDecks(object, params, ctx, resolveInfo) {
  const decks =  await Deck.find({});
  if (!decks) {
    throw new Error('Error')
  }

  return decks
}

async function getPhrasesInDeck(object, params, ctx, resolveInfo) {
  const phrases =  await Phrase.find( { deck_id: params.deck_id } )
  if (!phrases) {
    throw new Error('Error')
  }

  return phrases
}

async function setPhraseLearned(object, params, ctx, resolveInfo){
  console.log("SET PHRASE LEARNED")
  console.log(params)
}

const schema = gql`
  type Mutation {
  	CreateUser(user_name: String! user_email: String! user_password: String! user_role: String! = "STUDENT"): User
  	Login(user_email: String! user_password: String!): User
    setPhraseLearned(deck_id: Int, phrase_order: Int): String
  }

  type Query {
  	me: User
  	getPhraseByDeckIdPhraseOrder(deck_id: Int phrase_order: Int): Phrase
  	getDecks: [Deck]
  	getPhrasesInDeck(deck_id: Int): [Phrase]
  }

  type Deck {
  	deck_id: Int
  	deck_name: String
    deck_description: String
    phrase_count: Int
  }  

  type Phrase {
  	_id: String
  	phrase_order: Int
  	full_phrase: String
  	phrase_no_punctuation: String
  	word_list: [String]
  	pinyin: [String]
    pinyin_no_tones: [String]
  	written_tones: [String]
  	spoken_tones: [String]
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
   	},
    setPhraseLearned(object, params, ctx, resolveInfo) {
       return setPhraseLearned(object, params, ctx, resolveInfo) 
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
    },
    getPhraseByDeckIdPhraseOrder(object, params, ctx, resolveInfo) {
      return getPhraseByDeckIdPhraseOrder(object, params, ctx, resolveInfo)    
    },
  	getDecks(object, params, ctx, resolveInfo) {
  	  return getDecks(object, params, ctx, resolveInfo)    
  	},
  	getPhrasesInDeck(object, params, ctx, resolveInfo) {
  	  return getPhrasesInDeck(object, params, ctx, resolveInfo)    
  	},      
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