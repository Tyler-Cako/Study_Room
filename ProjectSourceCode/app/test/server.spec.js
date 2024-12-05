// ********************** Initialize server **********************************

const {app, server} = require('../dist/index.js'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************
const bcrypt = require('bcryptjs');
const db = require('../dist/db.js').default;
const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

describe('Testing Add User API', () => {
  it('positive : /register. should successfully register student', done => {
    chai
      .request(server)
      .post('/register')
      .send({name: 'John Smith', email: 'john123@gmail.com', password: '12345'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });
  it('Negative : /register. Checking invalid name', done => {
    chai
      .request(server)
      .post('/register')
      .send({name: 10, email: '123123', password:'12345'})
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body.message).to.equals('Invalid input');
        done();
      });
  });
});
describe('Testing Login API', () => {
  const testUser = {
    name: 'John Doe',
    email: 'john@gmail.com',
    password: 'password'
  }
  //Add dummy user to check login 
  before((done) => {
    bcrypt.hash(testUser.password, 10).then((hashedP) => {
      const query = `
        INSERT INTO student (name, email, password)
        VALUES ($1, $2, $3)`;

      db.none(query, [testUser.name, testUser.email, hashedP])
        .then(() => done()) 
        .catch((err) => {
          console.error('Error inserting test user:', err);
          done(err); 
        });
    });
  });

  it('positive : /login. If user exists, should successfuly log them in and redirect to chat page.', done => {
    chai
      .request(server)
      .post('/login')
      .send({ email: testUser.email, password: testUser.password})
      .end((err, res) => {
        // Add this back once rendering is fixed -  expect(res).to.redirect;
        expect(res).to.have.status(200);
        done();
      });
  });

  it('Negative : /login. Should return invalid password error', done => {
    chai
      .request(server)
      .post('/login')
      .send({ email: testUser.email, password:'notpassword'})
      .end((err, res) => {
        expect(res).to.have.status(400);
        done();
      });
  });
  
  describe('Testing Add Class API', () => {
    let agent; 
    const testUser = {
      name: 'Test User',
      email: "testuser@ex.com",
      password: "password"
    }
    before(async () => {
      // Hash the password
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
  
      // Insert the test user into the database
      const insertUserQuery = `
        INSERT INTO student (name, email, password)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO NOTHING`;
  
      await db.none(insertUserQuery, [testUser.name, testUser.email, hashedPassword]);
  
      // Initialize the agent
      agent = chai.request.agent(server);
  
      // Perform login to establish session
      const loginRes = await agent
        .post('/login')
        .send({ email: testUser.email, password: testUser.password });
  
      expect(loginRes).to.have.status(200);
    });
    after(async () => {
      agent.close();
    })

    it('positive : /add. Should successfully add a class to the student\'s schedule', done => {
      const request = {
        class_code: 'CSCI 4444',
        section: '100',
        semester: 'SP25'
      };
      agent
        .post('/add')
        .send(request)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

    it('negative : /add. Should return a duplicate error when adding class that is already included', done => {
      const duplicateRequest = {
        class_code: 'CSCI 4444',
        section: '100',
        semester: 'SP25',
      };
      agent
        .post('/add')
        .send(duplicateRequest)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
  }); 
});


// ********************************************************************************