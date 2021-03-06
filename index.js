const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const tokenMaster = require('./src/tokenMaster');
const db = require('./src/db');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 3001;
app.use(cors());
app.use(bodyParser.json({strict: false}));
app.use(express.json({limit: '1mb'}))
app.use(express.static('public'))
// public route
app.get('/help', (req, res) => {
    res.json(require('./src/documentation.json'));
});

const isTest = true;

// public route
app.get('/health', (req, res) => {
    res.status(200).send("<hr/><h1 style=\"text-align:center\">I am up and running, fortunately Corona does not kill machines. :)</h1><hr/>")
});

db.getCovidData();

app.get('/ll/:address', (req, res) => {
    db.getll(req.params.address).then(data => {
        res.json(data)
    })
});

app.get('/master', (req, res) => {
    db.getCovidData().then(data => {
        res.json(data)
    })
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (username && password) {
        console.dir({
            username: username,
            password: password
        })
        db.fetchUser(username).then(function (user) {
            if (user.password == password) {
                tokenMaster.getJwtToken(
                    {username: username, ...user}
                ).then(tokenObj => {
                    const localUsrObj = {...user}
                    delete localUsrObj.password;
                    return res.json(getSuccessResponse({
                        user: {username: username, ...localUsrObj},
                        ...tokenObj
                    }))
                }).catch(error => {
                    console.log(error.stack)
                    return res.status(500).json(getErrorResponse(error.message));
                });
            } else {
                return res.status(401).json(getErrorResponse(`Incorrect username or password ${user.password}   ${password}`));
            }
        }).catch(function (error) {
            console.log(error.message)
            return res.status(500).json(
                getErrorResponse(error.message));
        });
    } else {
        return res.status(400).json(getErrorResponse('Missing username or password'));
    }
});

// secured route
app.get('/details/:manager', verifyToken, (req, res) => {
    const manager = req.params.manager;
    db.getReportees(manager).then(details => res.status(200).json(
        getSuccessResponse(details)
    ))
});

app.get('/', (req, res) => {
    return res.redirect(301, '/login.htm');
});

function verifyToken(req, res, next) {
    if (isTest) {
        next();
    } else {
        tokenMaster.verifyJwtToken(req, res).then(user => {
            req.user = user;
            next();
        });
    }
}

function getSuccessResponse(obj) {
    return getResponse(obj, true);
}

function getErrorResponse(error, obj) {
    return getResponse(obj, false, error);
}

function getResponse(obj, success, error) {
    const respObj = {
        success: true,
        data: {},
        error
    };

    if (success !== undefined && success === false)
        respObj.success = false;
    if (error)
        respObj.error = error;
    if (obj)
        respObj.data = obj;

    return respObj;
}

app.listen(port, () => console.log(`My App listening on port ${port}!`))
