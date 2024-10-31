GRANT ALL PRIVILEGES ON DATABASE study_room TO docker;

CREATE TABLE student (
    student_id SERIAL PRIMARY KEY,
    name varchar(30) NOT NULL,
    email varchar(250) UNIQUE NOT NULL,
    password varchar(250) NOT NULL
);

CREATE TABLE class (
    class_id SERIAL PRIMARY KEY,
    name varchar(250) NOT NULL,
    class_time timestamp NOT NULL,
    location varchar(250)
);

CREATE TABLE student_to_class (
    student_id INT REFERENCES student(student_id) NOT NULL,
    class_id INT REFERENCES class(class_id) NOT NULL,

    PRIMARY KEY(student_id, class_id)
);

CREATE TABLE student_to_student (
    student_id_1 INT REFERENCES student(student_id) NOT NULL,
    student_id_2 INT REFERENCES student(student_id) NOT NULL,

    PRIMARY KEY(student_id_1, student_id_2),

    CONSTRAINT unique_student_pair CHECK (student_id_1 != student_id_2)
);

CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES student(student_id) NOT NULL,
    class_id INT REFERENCES class(class_id) NOT NULL,
    message_body varchar(500) NOT NULL,
    created_at timestamp NOT NULL
);