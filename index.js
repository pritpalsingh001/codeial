const express=require('express');
const env=require('./config/environment');
const morgan=require('morgan'); 
const app=express();
require('./config/view-helpers')(app);
const port=8000;
const expressLayouts=require('express-ejs-layouts');
const db=require('./config/mongoose')
const cookieParser=require('cookie-parser');
const session=require('express-session')
const passport=require('passport')
const passportLocal=require('./config/passport-local-strategy')
const passportJWT=require('./config/passport-jwt-strategy')
const passportGoogle=require('./config/passport-google-oauth2-strategy')


const MongoStore=require('connect-mongo')(session)
const sassMiddleware=require('node-sass-middleware')
const flash=require('connect-flash');
const customMware=require('./config/middleware');

// setting up chat serverto work with socket.io 
const chatServer=require('http').Server(app);
const chatSockets=require('./config/chat_sockets').chatSockets(chatServer);
chatServer.listen(5000);
console.log('chat server is listening on port 5000');
const path=require('path');

if(env.name =='development'){
    app.use(sassMiddleware({
        src:path.join(__dirname,env.asset_path,'/scss'),
        dest:path.join(__dirname,env.asset_path,'/css'),
        debug:true,
        prefix:'/css',
        outputStyle:'extended'
    }));
}



app.use(express.urlencoded());
app.use(cookieParser());

app.use(express.static(env.asset_path));
//make the uploads path available to the browser
app.use('/uploads',express.static(__dirname+'/uploads'));

app.use(env.morgan.mode,env.morgan.options);
app.use(expressLayouts);

//extract script and style files in the layout 
app.set('layout extractStyles',true);
app.set('layout extractScripts',true);



//setup views
app.set('view engine','ejs')
app.set('views','./views')



//mongoStore is used to store the session cookie in the db
app.use(session({
    name:'codeial',
    //to do change the secret before deployment
    secret:env.session_cookie_key,
    saveUninitialized:false,
    resave:false,
    cookie:{
        maxAge: (1000*60*100)
    },
    store:new MongoStore(
        {
            mongooseConnection:db,
            autoRemove:'disabled'
        },
        function(err)
        {
            console.log(err || 'connect-mongo-setup ok')
        }
    )

}));

app.use(passport.initialize());
app.use(passport.session());


app.use(passport.setAuthenticatedUser);

app.use(flash())
app.use(customMware.setFlash);

//use routes here
app.use('/',require('./routes'))

app.listen(port,function(err){
    if(err)
    {
        console.log(`error in running the server: ${err}`);
        return;
    }
    console.log(`server running on the port:${port}`);
});