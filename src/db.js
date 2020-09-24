const users = {
    junaid: {
        name: "Junaid Karim",
        password: "pass123",
        isManager: true,
        geo: {
            lat: "",
            lng: ""
        }
    },
    lokesh: {
        name: "Lokesh Puri",
        password: "pass123",
        isManager: true,
        geo: {
            lat: "",
            lng: ""
        }
    },
    nikhil: {
        name: "Nikhil",
        password: "pass123",
        isManager: true,
        geo: {
            lat: "",
            lng: ""
        }
    },
    ramsha: {
        name: "Ramsha",
        password: "pass123",
        geo: {
            lat: "",
            lng: ""
        }
    },
    poonam: {
        name: "Poonam Rajput",
        password: "pass123",
        geo: {
            lat: "",
            lng: ""
        }
    },
    pankaj: {
        name: "Pankaj Kumawat",
        password: "pass123",
        geo: {
            lat: "",
            lng: ""
        }
    },
    mustufa: {
        name: "Mustufa Gunderwala",
        password: "pass123",
        geo: {
            lat: "",
            lng: ""
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
        resolve(users[username]);
    });
}

module.exports.getReportees = function (username) {
    return new Promise((resolve, reject) => {
            const employees = [];
            team_assigned[username].teams.forEach(teamName => teams[teamName].forEach(member => employees.push(users[member])));
            resolve(employees);
        }
    );
}