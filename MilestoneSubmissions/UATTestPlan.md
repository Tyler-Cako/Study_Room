# UAT Test Plan

### Features:
1. Login
2. Register
3. Class Registration
4. Group Chat
5. Deployment

### Environment:
The user should be able to navigate to the (online) website that's hosted on the cloud.

### Acceptance Testers:
Customer: i.e. the TA or other course staff. Developers can also complete UAT testing as needed.

### Login
- **UNIT TEST:** Positive unit test case for logging in
    - Username: existing email in DB ex: tyler.cako@colorado.edu
    - Password: password in DB: ex: 1234

- **UNIT TEST:** Negative unit test case for logging in
    - Username: email that doesn't exist in DB ex: tylerrrr.cako@colorado.edu
    - Password: password in DB: ex: 1234

- Acceptance Criteria: 
    1. User navigates to home webpage
    2. User navigates to login page
    3. User fills the following criteria. Form can't submit unless both fields are filled:
        - email: tyler.cako@colorado.edu
        - password: 1234
    4. User clicks login, redirected back to home
    5. User can view their profile
    
### Register
- **UNIT TEST:** Positive unit test case for registering
    - Username: email that doesn't exist in DB ex: tyler1.cako@colorado.edu
    - Password: password in DB: ex: 1234

- **UNIT TEST:** Negative unit test case for logging in
    - Username: email that already exists in DB ex: tyler.cako@colorado.edu
    - Password: password in DB: ex: 1234

- Acceptance Criteria: 
    1. User navigates to home webpage
    2. User navigates to register page
    3. User fills the following criteria. Form can't submit unless both fields are filled:
        - email: tyler1.cako@colorado.edu
        - password: 1234
    4. User clicks register, redirected back to home
    5. User can view their profile

### Class Registration
- **UNIT TEST:** GET Unit test by id
    - Can receieve a class of specified id
- **UNIT TEST:** POST unit test - create new class
    - Can create a new class

- Acceptance Criteria:
    1. User navigates to webpage home.
    2. User clicks add a class dropdown
    3. User selects a class dropdown
    4. User submits form
    5. On reload, the user should see the class as part of their class list, and should be able to view the class's respective group chat.
