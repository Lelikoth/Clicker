const express = require('express');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3').verbose();
const sessions = require('express-session');

const db = new sqlite3.Database('pepe.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the pepe database.');
});


const app = express();
const port = 3000;
const oneHour = 1000 * 60 * 60;

app.use(express.static('views'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(sessions({
    secret: 'keyboard pepe',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: oneHour }
}));

var session;

app.get('/', (req, res) => {
    res.render('register.ejs');
});

app.post('/', (req, res) => {

    let email = req.body.email;
    let password = req.body.password;
    let password2 = req.body.password2;

    if (email == '' || password == '' || password2 == '') {
        console.log("Please fill in all fields!");
        res.redirect('/');
    }

    if (password == password2) {
        db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, password], (err) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log('User added');
                res.redirect('/login');
            }
        });
    }
    else {
        console.log("Passwords don't match!");
        res.redirect('/');
    }
});


app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.post('/login', (req, res) => {
    var email = req.body.email;
    var password = req.body.password;
    db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
        if (err) {
            console.log("There is no such user!");
            res.redirect('/');
        }
        if (row) {
            res.cookie("email", email);
            res.cookie("password", password);
            res.redirect('/game');
        }
    });

});

app.get('/game', (req, res) => {
    if (req.cookies.email && req.cookies.password) {
        var email = req.cookies.email;
        var password = req.cookies.password;
    } else {
        res.redirect('/login');
    }
    db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
        if (err) {
            console.log(err);
        }
        else if (row) {
            res.render('game.ejs', { pepe_points: row.pepe_points });
        } else {
            res.redirect('/login');
        }
    });

});

app.post('/save', (req, res) => {
    let pepe_points = req.body.pepePoints;
    console.log(pepe_points)
    db.run('UPDATE users SET pepe_points = ? WHERE email = ? AND password = ?', [pepe_points, req.cookies.email, req.cookies.password], (err) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log('User updated');
        }
    }
    );
});

app.post('/logout', (req, res) => {

    res.clearCookie("email");
    res.clearCookie("password");
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect('/');
        }
    }
    );

});

//check if cookie is still valid
app.get('/check', (req, res) => {
    session = req.session;
    if (session.email && session.password) {
        db.get('SELECT * FROM users WHERE email = ? AND password = ?', [session.email, session.password], (err, row) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log(row);
                session.pepe_points = row.pepe_points;
                res.render('game.ejs', { pepe_points: row.pepe_points });
            }
        });
    }
    else {
        res.redirect('/');
    }
});


app.listen(port);
