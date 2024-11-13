export const createUsers = async (db, password) => {
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

    const password = await bcrypt.hash(124)

    try {    
        for (let i = 0; i < accounts.length; i++) {
            const query = 
                'insert into student (name, email, password) values ($1, $2, $3)  returning * ;';

            db.any(query, [
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
    } catch (error) {
        console.log(error);
    }


}