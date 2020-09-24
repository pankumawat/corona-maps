const masterData = {...require('./geo.json')};
const axios = require('axios');

const users = {
    junaid: {
        name: "Junaid Karim",
        password: "pass123",
        isManager: true,
        address: {
            state: "Delhi",
            dist: "South Delhi",
        }
    },
    lokesh: {
        name: "Lokesh Puri",
        password: "pass123",
        isManager: true,
        address: {
            state: "Uttar Pradesh",
            dist: "Gautam Buddha Nagar",
        }
    },
    nikhil: {
        name: "Nikhil",
        password: "pass123",
        isManager: true,
        address: {
            state: "Delhi",
            dist: "North East Delhi",
        }
    },
    ramsha: {
        name: "Ramsha",
        password: "pass123",
        address: {
            state: "Uttar Pradesh",
            dist: "Ghazipur",
        }
    },
    poonam: {
        name: "Poonam Rajput",
        password: "pass123",
        address: {
            state: "Delhi",
            dist: "South West Delhi",
        }
    },
    pankaj: {
        name: "Pankaj Kumawat",
        password: "pass123",
        address: {
            state: "Uttar Pradesh",
            dist: "Gautam Buddha Nagar",
        }
    },
    mustufa: {
        name: "Mustufa Gunderwala",
        password: "pass123",
        address: {
            state: "Uttar Pradesh",
            dist: "Gautam Buddha Nagar",
        }
    }
}

const teams = {
    gotham: [
        "junaid",
        "pankaj",
        "mustufa"
    ],
    romans: [
        "lokesh",
        "poonam",
        "ramsha"
    ]
}

const team_assigned = {
    nikhil: {
        teams: ["gotham", "romans"]
    },
    lokesh: {
        teams: ["romans"]
    },
    junaid: {
        teams: ["gotham"]
    }
}

module.exports.fetchUser = function (username) {
    return new Promise((resolve, reject) => {
        if (users[username]) {
            resolve(users[username]);
        } else {
            reject(new Error("No such user exists."))
        }
    });
}

module.exports.getReportees = function (username) {
    return new Promise((resolve, reject) => {
            const employees = [];
            let amIin = false;
            team_assigned[username].teams.forEach(teamName => teams[teamName].forEach(member => {
                if (member == username)
                    amIin = true;
                const user = users[member];
                const covidStats = {
                    ...masterData[user.address.state][user.address.dist]
                }
                const geo = {...covidStats.geo};
                delete covidStats[geo];

                employees.push({
                    ...user,
                    isManager: (user.isManager === true),
                    ...covidStats
                })
            }));
            if (!amIin) {
                const user = users[username];
                employees.push({
                    ...user,
                    isManager: (user.isManager === true),
                    ...masterData[user.address.state][user.address.dist]
                })
            }
            resolve(employees);
        }
    );
}

module.exports.masterData = masterData;

module.exports.getll = function (address) {
    return new Promise((resolve, reject) => {
        axios.get(`https://www.google.co.in/maps/search/${address}`)
            .then(response => {
                try {
                    const ll = response
                        .data
                        .match(/staticmap\?center=.*&/g)[0]
                        .replace('%2C', ',')
                        .split('=')[1]
                        .split('&')[0]
                        .split(',');

                    // console.log(ll);
                    resolve({
                        lat: ll[0],
                        lng: ll[1]
                    });
                } catch (error) {
                    resolve({
                        lat: -1,
                        lng: -1
                    })
                }
            })
            .catch(error => {
                console.log(error);
                reject(error);
            });
    });
}

module.exports.getCovidData = function () {
    console.log("Data Refreshed");
    const nextTime = new Date();
    nextTime.setHours(nextTime.getHours() + 12);
    console.log(`Next refresh scheduled ${nextTime}`);
    setTimeout(require('./db').getCovidData, 12 * 60 * 1000);
    return new Promise((resolve, reject) => {
        let newFetching = false;
        axios.get("https://api.covid19india.org/state_district_wise.json")
            .then(response => {
                const json = response.data;
                Object.keys(json).forEach(state => {
                    const stateJson = json[state].districtData;
                    if (stateJson) {
                        Object.keys(stateJson).forEach(dist => {
                            const distData = stateJson[dist];
                            if (!masterData[state])
                                masterData[state] = {};
                            if (!masterData[state][dist]) {
                                console.log("I DID NOT EXPECT THIS... OR IS THIS A NEW DIST or STATE?");
                                newFetching = true;
                                getll(`${dist}, ${state}`).then(ll => {
                                    masterData[state][dist] = {
                                        geo: {...ll}
                                    };
                                })
                            }
                            
                            let riskNumber = (distData.confirmed > 0 ? ((distData.active + 5 * distData.deceased)) : 0);
                            let risk = 0;
                            if (riskNumber > 0 && riskNumber <= 20)
                                risk = 1;
                            else if (riskNumber > 20 && riskNumber <= 80)
                                risk = 2;
                            else if (riskNumber > 80 && riskNumber <= 200)
                                risk = 3;
                            else if (riskNumber > 200 && riskNumber <= 500)
                                risk = 4;
                            else if (riskNumber > 500 && riskNumber <= 1000)
                                risk = 5;
                            else if (riskNumber > 1000)
                                risk = 6;

                            masterData[state][dist] = {
                                ...masterData[state][dist],
                                active: distData.active,
                                confirmed: distData.confirmed,
                                deceased: distData.deceased,
                                recovered: distData.recovered,
                                risk: risk
                            };
                        });
                    }
                });
                setTimeout(
                    () => resolve(masterData), newFetching ? 5000 : 0);
            })
            .catch(error => {
                console.log(error);
            });
    });
}