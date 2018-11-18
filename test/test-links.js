'use strict';
global.DATABASE_URL = 'mongodb://localhost/jwt-auth-demo-test';
const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const {app, runServer, closeServer} = require('../server');
const {User} = require('../users');
const  { Link } = require('../links/models');
const  { Category } = require('../categories/models');
const {JWT_SECRET} = require('../config');

const expect = chai.expect;

// This let's us make HTTP requests
// in our tests.
// see: https://github.com/chaijs/chai-http
chai.use(chaiHttp);

describe('/api/links', function() {
    const username = 'exampleUser';
    const password = 'examplePass';
    const firstName = 'Example';
    const lastName = 'User';
    const usernameB = 'exampleUserB';
    const passwordB = 'examplePassB';
    const firstNameB = 'ExampleB';
    const lastNameB = 'UserB';
    
    const testLink = {
      url: 'https://www.google.com',      
      // id for user is set in beforeEach below
    }

    let testUser = null;
    let token = null;  
    let linkArray = null;  
    
    before(function() {
        return runServer();
      });
    
    after(function() {
      return closeServer();
    });
  
    beforeEach(function() {
      testUser = null;
      return User.hashPassword(password).then(password =>
        User.create({
          username,
          password,
          firstName,
          lastName
        })
        .then(user => {         
          testUser = user;   
          testLink.user = user._id; 

          token = jwt.sign(
            {
              user: {
                username,
                firstName,
                lastName,
                id: testUser._id
              }
            },
            JWT_SECRET,
            {
              algorithm: 'HS256',
              subject: username,
              expiresIn: '7d'
            }
          ); 
          // array used for adding links for test user to db
          linkArray =  [{
            url: 'https://www.cnn.com',
            user: testUser._id.toString()
          },
          {
            url: 'https://www.drudgereport.com',
            user: testUser._id.toString()
      
          }];
        
        })
      );
    });
  
    afterEach(function() {    
      User.remove({})
      .then(function() {
        return Link.remove({});
      })
      .then(function() {
        return Category.remove({});
      });
    });

    describe('POST', function() {
      it ('should not add link if no authenticated user (jwt)', function() {
        return chai
          .request(app)
          .post('/api/links')
          .send({
            url: 'https://www.google.com'
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(401);            
          });
      });

      it ('should not add a link without url', function() {                
        return chai
          .request(app)
          .post('/api/links')
          .set('authorization', `Bearer ${token}`)                    
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Missing field');
            expect(res.body.location).to.equal('url');
          });
      });

      it ('should not add a link with an invalid url', function() {        
        const url = 'https://wwwlkj';      
        return chai
          .request(app)
          .post('/api/links')
          .set('authorization', `Bearer ${token}`)
          .send({
            url
          })                    
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(`URL '${url}' is not formatted properly`);
            expect(res.body.location).to.equal('url');
          });
      });

      it ('should add a link without a category (defaults to "none")', function() {
        let response = null;
        const url = 'https://www.google.com';        
        return chai
          .request(app)
          .post('/api/links')
          .set('authorization', `Bearer ${token}`)
          .send({
            url            
          })                    
          .then((res) => {           
            response = res;
            return Category.findById(res.body.data.category.toString());
          })
          .then(category => {                        
            expect(category.name).to.equal('none');
            expect(response.body.data.url).to.equal(url);
            expect(response.body.data.user).to.equal(testUser._id.toString());
            expect(response).to.have.status(201);
          });
      }).timeout(20000);

      it ('should add a link with the provided category', function() {
        let response = null;
        const catInput = 'news';
        const url = 'https://www.google.com';        
        return chai
          .request(app)
          .post('/api/links')
          .set('authorization', `Bearer ${token}`)
          .send({
            url,
            category: catInput         
          })                    
          .then((res) => {          
            response = res;
            return Category.findById(res.body.data.category.toString());
          })
          .then(category => {                       
            expect(category.name).to.equal(catInput);
            expect(response.body.data.url).to.equal(url);
            expect(response.body.data.user).to.equal(testUser._id.toString());
            expect(response).to.have.status(201);
          });
      }).timeout(20000);
    });

    describe('DELETE', function () {
     
      it ('should not delete link if no authenticated user (jwt)', function() {        
        return chai
          .request(app)
          .delete('/api/links/1234')            
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }  
            const res = err.response;
            expect(res).to.have.status(401);            
          });
        });

      it ('should delete a link', function() {        
        let response = null;        
        const token = jwt.sign(
          {
            user: {
              username,
              firstName,
              lastName,
              id: testUser._id
            }
          },
          JWT_SECRET,
          {
            algorithm: 'HS256',
            subject: username,
            expiresIn: '7d'
          }
        );
        return Link.create(testLink)
        .then(link => {
          return chai
          .request(app)
          .delete(`/api/links/${link._id.toString()}`)
          .set('authorization', `Bearer ${token}`)                             
          .then((res) => {          
            response = res;
            return Link.findById(link._id.toString());
          })
          .then(delLink => {                       
            expect(delLink).to.be.null;
            expect(response).to.have.status(204);
          });
        });       
      });
    });

    describe('/GET', function() {
      it ('should return an empty array if user has no links', function() {                            
          return chai
          .request(app)
          .get('/api/links/')    
          .set('authorization', `Bearer ${token}`)        
          .then(function(res) {            
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).to.have.length(0);
          });
        });

      it ('should get all links for a user', function() {
        // create links for main user
        return Link.create(linkArray)        
        .then(function () {
          //create a new user and a dummy link for the new user to test that only a particular
          // user's links get returned (userB's links should NOT be returned in GET request below)
          return User.create({
              username: usernameB,
              password: passwordB,
              firstName: firstNameB,
              lastName: lastNameB
            });        
        })
        .then( function(newUser) {
          return Link.create({
            url: 'https://www.cnn.com',
            user: newUser._id
          })
        })
        .then(function() {                
          return chai
          .request(app)
          .get('/api/links/')    
          .set('authorization', `Bearer ${token}`)        
          .then(function(res) {            
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).to.have.length(linkArray.length);
          })
          
        });
      });

    });

    describe('PUT', function() {
      it ('should return 401 response if user not authenticated', function() {
        return chai
          .request(app)
          .put(`/api/links/1234`)                                              
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }  
            const res = err.response;
            expect(res).to.have.status(401);            
          });
      });

      it ('should update a link', function() {        
        let response = null;   
        const updates = {
          title: 'updated title',
          url: 'https://www.cnn.com',
          note: 'updated note'
        }             
        return Link.create(testLink)
        .then(link => {         
          return chai
          .request(app)
          .put(`/api/links/${link._id.toString()}`)
          .set('authorization', `Bearer ${token}`)    
          .send(updates)                         
          .then((res) => {          
            response = res;
            return Link.findById(link._id.toString());
          })
          .then(updatedLink => {   
            const { title, url, note } = response.body.data;
            expect(response.body.data).to.be.an('object');  
            expect(title).to.equal(updates.title);
            expect(url).to.equal(updates.url);
            expect(note).to.equal(updates.note);                                    
            expect(updatedLink.title).to.equal(updates.title);
            expect(updatedLink.url).to.equal(updates.url);
            expect(updatedLink.url).to.equal(updates.url);            
            expect(response).to.have.status(200);
          });
        });       
      });
    });

});