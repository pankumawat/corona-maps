const jwt = require('jsonwebtoken');

const TOKEN_SECRET = process.env.TOKEN_SECRET || "7bc78545b1a3923cc1e1e19523fd5c3f20b409509";

exports.getJwtToken = function (user, expiry) {
    return new Promise(function (resolve, reject) {
        const userObj = {username: user.username, email: user.email, flags: user.flags};
        expiry = expiry === undefined ? '24h' : expiry;
        const opts = {expiresIn: expiry};
        try {
            const accessToken = jwt.sign(userObj, TOKEN_SECRET, opts);
            jwt.verify(accessToken, TOKEN_SECRET, (err, user) => {
                if (user)
                    resolve({accessToken: accessToken, expireAt: user.exp * 1000});
                if (err)
                    reject(err);
            })
        } catch (error) {
            reject(error);
        }
    });
}

exports.verifyJwtToken = function (req, res) {

    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(' ')[1]

    const ignoreExpiration = false;
    return new Promise(function (resolve, reject) {
        if (accessToken) {
            try {
                jwt.verify(accessToken, TOKEN_SECRET, {ignoreExpiration: ignoreExpiration}, (err, user) => {
                    if (err) {
                        return res.status(403).json({
                            status: 'failed',
                            message: 'invalid authorization token'
                        });
                    }
                    resolve(user);
                });
            } catch (error) {
                reject(error);
            }
        } else {
            return res.status(401).json({
                status: 'failed',
                message: 'missing authorization token'
            });
        }
    });
}