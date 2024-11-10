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
    days varchar(8) NOT NULL,
    start_time int NOT NULL,
    stop_time int NOT NULL,
    section int NOT NULL
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

-- Init class table.. Students and related tables will be updated with Node script due to password hashing.
INSERT into class (name, days, start_time, stop_time, section) VALUES ('CSCI 1300 - Computer Science 1: Starting Computing', 'MWF', 545, 595, 100);
INSERT into class (name, days, start_time, stop_time, section) VALUES ('CSCI 1300 - Computer Science 1: Starting Computing', 'MWF', 805, 855, 200);
INSERT into class (name, days, start_time, stop_time, section) VALUES ('CSCI 1300 - Computer Science 1: Starting Computing', 'MWF', 935, 985, 300);

INSERT into class (name, days, start_time, stop_time, section) VALUES ('CSCI 2270 - Computer Science 2: Data Structures', 'MWF', 805, 855, 100);
INSERT into class (name, days, start_time, stop_time, section) VALUES ('CSCI 2270 - Computer Science 2: Data Structures', 'MWF', 935, 985, 200);

INSERT into class (name, days, start_time, stop_time, section) VALUES ('CSCI 2400 - Computer Systems', 'TTh', 660, 735, 100);

INSERT into class (name, days, start_time, stop_time, section) VALUES ('CSCI 3155 - Principles of Programming Languages', 'TTh', 570, 645, 100);

INSERT into class (name, days, start_time, stop_time, section) VALUES ('CSCI 3308 - Software Development Methods and Tools', 'MW', 480, 530, 100);