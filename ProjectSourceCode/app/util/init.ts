import bcrypt from 'bcryptjs';
import db from "./db";

export const createTestStudents = async () => {
    const accounts = [
        {
            name: "Tyler",
            email: "tyler.cako@colorado.edu"
        },
        {
            name: "Alan",
            email: "alan.kerdman@colorado.edu"
        },
        {
            name: "Josh",
            email: "josh.wright@colorado.edu"
        },
        {
            name: "Jake",
            email: "jake.tucker@colorado.edu"
        }
    ]

    const password = await bcrypt.hash("1234", 10);


    try {    


        // Create students
        const studentQuery = 
        'insert into student (name, email, password) values ($1, $2, $3)  returning * ;';
        for (let i = 0; i < accounts.length; i++) {
            db.any(studentQuery, [
                accounts[i].name,
                accounts[i].email,
                password,
            ])
            .then(function (data) {
                console.log(data);
              })
            .catch(function (err) {
            throw new Error(err);
            });
        }

        // Create class row
        const classQuery = 'INSERT into class (name, days, start_time, stop_time, section) VALUES ($1, $2, $3, $4, $5);'

        db.any(classQuery, ["Test Class", "MWF", 160, 210, 100]);

        // Map students to test class
        const studentsToClassQuery = "Select "
    } catch (error) {
        console.log(error);
    }


}