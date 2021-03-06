const express = require('express')
const bodyParser = require('body-parser')
const {ApolloServer, gql} = require('apollo-server-express')
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const asyncLib = require('async')
const { ACCESS_SECRET, REFRESH_SECRET, getUserId } = require('./utils')
const path = require('path');
const app = express();

mongoose.connect('mongodb://db/tone_db', {useNewUrlParser: true});

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


const userProgressSchema = new mongoose.Schema({
  user_id: String,
  deck_id: Number,
  phrase_order: Number,
  is_completed_char: Boolean,
  is_completed_full: Boolean
});

const UserProgress = mongoose.model('UserProgress', userProgressSchema);


async function signup(object, params, ctx, resolveInfo) {
  params.password = await bcrypt.hash(params.user_password, 10)
  const newUser = new User({ user_name: params.user_name, user_email: params.user_email, user_password: params.password, user_role: params.user_role })
  var user
  
  try{
  	user = await newUser.save()
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
  return user
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
 const phrases =  await Phrase.aggregate([
   {$match: {deck_id: params.deck_id}},
   {
      $lookup:
         {
           from: "userprogresses",
           let: { phrase_order: "$phrase_order", deck_id: "$deck_id"},
           pipeline: [
              { $match:
                 { $expr:
                    { $and:
                       [
                         { $eq: [ "$$phrase_order",  "$phrase_order" ] },
                         { $eq: [ "$$deck_id",  "$deck_id" ] },
                         { $eq: [ ctx.req.userId,  "$user_id" ] }                       ]
                    }
                 }
              }, {$project: {"is_completed_char": 1, "is_completed_full": 1}}           ],
           as: "completion"
         }
    }
  ])

  phrases.forEach((phrase)=> {
    if(phrase["completion"].length){
      phrase.is_completed_char = phrase["completion"][0].is_completed_char  
      phrase.is_completed_full = phrase["completion"][0].is_completed_full 
    }
  })
  return phrases
}

async function setPhraseLearned(object, params, ctx, resolveInfo){
  let updateObject = {is_completed_char: params.is_completed_char, is_completed_full: params.is_completed_full}
  const test =  await UserProgress.findOneAndUpdate({ user_id: ctx.req.userId, deck_id: params.deck_id, phrase_order: params.phrase_order }, updateObject, {upsert: true}, function (err, small) {
    if (err){
      throw new Error('Error')
    }
  })
  return updateObject
}

const schema = gql`
  type Mutation {
  	CreateUser(user_name: String! user_email: String! user_password: String! user_role: String! = "STUDENT"): User
  	Login(user_email: String! user_password: String!): User
    setPhraseLearned(deck_id: Int, phrase_order: Int, is_completed_char: Boolean, is_completed_full: Boolean): Progress
  }

  type Query {
  	me: User
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
    is_completed_char: Boolean
    is_completed_full: Boolean
  }

  type Progress {
    is_completed_char: Boolean
    is_completed_full: Boolean    
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

app.use(express.static('public'))

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

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

app.listen({ port: port }, () =>
  console.log(`GraphQL API ready at http://localhost:${port}`)
);