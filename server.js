const express = require('express');
const app = express();
const path = require('path');

const fs = require('fs')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

const userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))


app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
// app.use(jsonServer.defaults());


const SECRET_KEY = '123456789'
const expiresIn = '1h'

// Create a token from a payload 
function createToken(payload){
    return jwt.sign(payload, SECRET_KEY, {expiresIn})
}
  
  // Verify the token 
function verifyToken(token){
    return  jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ?  decode : err)
}
  
  // Check if the user exists in database
function isAuthenticated({email, password}){
    return userdb.users.findIndex(user => user.email === email && user.password === password) !== -1
}

app.post('/auth/login', (req, res) => {
    console.log(req)
    const {email, password} = req.body
    if (isAuthenticated({email, password}) === false) {
      const status = 200
      const message = 'Incorrect email or password'
      res.status(status).json({status, message})
      return
    }
    const access_token = createToken({email, password})
    const usersdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))
    const index = usersdb.users.findIndex((item) => item.email === email)
    const info = {cart: usersdb.users[index].cart,}
    res.status(200).json({access_token, info :info})
})

// app.use(/^(?!\/auth).*$/,  (req, res, next) => {
//     if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
//       const status = 401
//       const message = 'Bad authorization header'
//       res.status(status).json({status, message})
//       return
//     }
//     try {
//        verifyToken(req.headers.authorization.split(' ')[1])
//        console.log('token verified')
//        next()
//     } catch (err) {
//       const status = 401
//       const message = 'Error: access_token is not valid'
//       res.status(status).json({status, message})
//     }
// })


// custom check funxction
function check (req) {
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Bad authorization header'
    res.status(status).json({status, message})
    return false
  }
  try {
    const stat = verifyToken(req.headers.authorization.split(' ')[1])
    // acutal action
    console.log(stat)
    if (stat.email) {
     console.log("true")
     return stat
    }
    //actual action
  } catch (err) {
    const status = 401
    const message = 'Error: access_token is not valid'
    res.status(status).json({status, message})
  }
}

function uniqueEmail(email) {
  const usersdbupdated = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))
  return usersdbupdated.users.findIndex(user => user.email === email) !== -1
}
// custom check funxction

// custom experiment
app.post('/auth/verifyOnMount', (req, res) => {
  console.log(check(req))
  const value = check(req)
  if (value) {
    console.log("matched run code")
    const usersdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))
    const index = usersdb.users.findIndex((item) => item.email === value.email)
    const info = {cart: usersdb.users[index].cart,}
    console.log(info)
    // fav: userdb.users[index].cart
    const response = {...value, status: "ok", info: info}
    res.status(200).json(response)
  }
  else {
    res.status(200).json({status: "token expired"})
  }
})

// user create
app.post('/auth/register', (req, res) => {
  console.log(req.body.email)
  const email = req.body.email
  if (uniqueEmail(email)) {
    console.log('already exits')
    res.status(200).json({status: false, msg: 'Email Already Exists'})
    return
  }
  console.log("is uniquie")
  console.log(req.body) 
  // const users = userdb.users
  // users.push(JSON.stringify(obj))
  // fs.appendFile("./users.json", JSON.stringify(obj, undefined , 2) + ",", (() => {}));
  const {password} = req.body
  let newusers = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))
  console.log("pior to adding" + JSON.stringify(newusers))
  newusers.users.push(req.body)
  console.log("after to adding"+JSON.stringify(newusers))
  fs.writeFileSync('./users.json', JSON.stringify(newusers))
  const access_token = createToken({email, password})
  console.log(access_token)
  res.status(200).json({status: true, access_token: access_token, userid: email})
})



app.post('/auth/cartAdd', (req, res) => {

  const email = check(req).email
  console.log(email)
  if (email) {
    let newusers = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))
    console.log("pior to adding" + JSON.stringify(newusers))
    const index = newusers.users.findIndex((item) => item.email === email);
    console.log(index)
    console.log(newusers.users[index].cart)
    if (!newusers.users[index].cart) {
      newusers.users[index].cart = []
      console.log("cart added")
    }
    console.log(newusers.users[index].cart.findIndex((item) => req.body.id === item.id))
    if (newusers.users[index].cart.findIndex((item) => req.body.id === item.id) > -1) {
      console.log("already exists")
      return
    }
    console.log("end", req.body)
    newusers.users[index].cart.push(req.body)
    fs.writeFileSync('./users.json', JSON.stringify(newusers))
    res.status(200).json({status: "ok", item: req.body})
  }
  else {
    res.status(200).json({status: "error"})
  }
})


app.post('/auth/cartRemove', (req, res) => {

  const email = check(req).email
  console.log(email)
  if (email) {
    let newusers = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))
    const index = newusers.users.findIndex((item) => item.email === email);
    console.log(index)
    console.log(newusers.users[index].cart)
    if (newusers.users[index].cart.findIndex((item) => item.id === req.body.id) > -1){
      console.log('match found')
      const newcart = newusers.users[index].cart.filter(item => !(item.id === req.body.id))
      console.log("newcart Array", newcart)
      newusers.users[index].cart = newcart
      console.log(newusers)
      fs.writeFileSync('./users.json', JSON.stringify(newusers))
      return
    }
    console.log(req.body)
    // console.log(newusers.users[index].cart.findIndex((item) => req.body.id === item.id))
    // if (newusers.users[index].cart.findIndex((item) => req.body.id === item.id) > -1) {
    //   console.log("already exists")
    //   return
    // }
    // console.log("end", req.body)
    // newusers.users[index].cart.push(req.body)
    // fs.writeFileSync('./users.json', JSON.stringify(newusers))
    console.log('already deleted')
    res.status(200).json({status: "already"})
  }
  else {
    res.status(200).json({status: "error"})
  }
})



// custom experiment
// server.use(router)


app.use(express.static(path.join(__dirname, 'build')));
app.get('*', function(req, res) {
  res.sendFile(path.resolve(__dirname, 'build', 'index.html'))
})
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`listening at ${port}`)
})