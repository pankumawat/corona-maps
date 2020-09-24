const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const tokenMaster = require('./src/tokenMaster');
const db = require('./src/db');
const HTMLParser = require('node-html-parser');

const axios = require('axios');
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

// public route
app.get('/health', (req, res) => {
    res.status(200).send("<hr/><h1 style=\"text-align:center\">I am up and running, fortunately Corona does not kill machines. :)</h1><hr/>")
});

app.get('/getlatlong/:address', (req, res) => {
    /*
        fetch(`https://www.google.co.in/maps/place/${req.params.address}`)
            .then((response) => {
                console.log(response.url);
            })
            .catch((error) => {
                console.log('Looks like there was a problem: \n', error);
            });
    */
        axios.get(`https://www.google.co.in/maps/search/${req.params.address}`)
            .then(response => {

                const node = HTMLParser.parse(response.data);

                console.log(JSON.stringify(node, undefined, 4));
                console.log(response.request.res.responseURL);
                console.log(response.request.res.responseURL);

                console.log(response.data.url);
                console.log(response.data.explanation);
            })
            .catch(error => {
                console.log(error);
            });

    //res.status(200).send("<hr/><h1 style=\"text-align:center\">I am up and running, fortunately Corona does not kill machines. :)</h1><hr/>")
});

const isTest = true;

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (username && password) {
        db.fetchUser(username).then(function (user) {
            if (user.password === password) {
                tokenMaster.getJwtToken(
                    {username: username, ...user}
                ).then(tokenObj => {
                    const localUsrObj = {...user}
                    delete localUsrObj.password;
                    return res.json({
                        user: {username: username, ...localUsrObj},
                        ...tokenObj
                    })
                }).catch(error => {
                    console.log(error.stack)
                    return res.status(500).json(getErrorResponse(error.message));
                });
            } else {
                return res.status(401).json(getErrorResponse('Incorrect username or password'));
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
    return res.redirect(301, '/help');
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
