# Study Room Project
This project focuses on creating chat rooms for students who are on the same network. The idea is that students can use this application to communicate with each other using websockets,
such that they can commicate with eachother in real time during classes, or when working on group projects (like this one!).

### Contributers for this project
- Tyler Cako
- Jake Tucker
- Allen Kerdman
- Jaron Rothbaum
- Josh Wright

### Technology Stack
- PostgreSQL
- Node JS
- Websocket
- front end framework?

### Prerequesits
- Node JS
- others...

### How to run locally
    0. If running on windows, open a WSL terminal
    1. Navigate to ProjectSourceCode
    2. Create a .env file in ProjectSourceCode
    3. Update .env file according to the environment variables posted in the teams.
    4. Run Docker Daemon (start docker)
    5. docker-compose up -d
        - This runs the database on your local machine
    6. Navigate to ProjectSourceCode/db
    7. sh connect.sh
    8. Navigate to ProjectSourceCode/app/
    9. npm i
    10. npm run dev
        - This starts the nodeJS web application with Nodemon

### How to run tests
To be implemented...

### Deployed application
To be implemented...
