GRANT ALL PRIVILEGES ON DATABASE study_room TO docker;

CREATE TABLE student (
    student_id SERIAL PRIMARY KEY,
    name varchar(30) NOT NULL,
    email varchar(250) UNIQUE NOT NULL,
    password varchar(250) NOT NULL
);

CREATE TABLE class (
    class_id SERIAL PRIMARY KEY,
    class_code varchar(122) NOT NULL,
    name varchar(250) NOT NULL,
    days varchar(8) NOT NULL,
    start_time int NOT NULL,
    stop_time int NOT NULL,
    section int NOT NULL,
    semester varchar(4) NOT NULL
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
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 1300', 'Computer Science 1: Starting Computing', 'MWF', 545, 595, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 1300', 'Computer Science 1: Starting Computing', 'MWF', 805, 855, 200, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 1300', 'Computer Science 1: Starting Computing', 'MWF', 935, 985, 300, 'SP25');

INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 2270', 'Computer Science 2: Data Structures', 'MWF', 805, 855, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 2270', 'Computer Science 2: Data Structures', 'MWF', 935, 985, 200, 'SP25');

INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 2400', 'Computer Systems', 'TTh', 660, 735, 100, 'SP25');

INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3104', 'Algorithms', 'TTh', 570, 645, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3104', 'Algorithms', 'MWF', 675, 725, 200, 'SP25');

INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3155', 'Principles of Programming Languages', 'TTh', 570, 645, 100, 'SP25');

INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3308', 'Software Development Methods and Tools', 'MW', 480, 530, 100, 'SP25');

INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 2820', 'Linear Algebra with Computer Science Applications', 'MWF', 545, 595, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 2824', 'Discrete Structures', 'MWF', 610, 660, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3002', '
Fundamentals of Human Computer Interaction', 'TTh', 750, 825, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3010', 'Intensive Programming Workshop', 'TTh', 840, 915, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3022', 'Introduction to Data Science with Probability and Statistics', 'MWF', 610, 660, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3090', 'Introduction to Quantum Computing', 'MWF', 870, 800, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3112', 'Professional Development in Computer Science', 'W', 740, 790, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3202', '
Introduction to Artificial Intelligence', 'MWF', 870, 920, 100, 'SP25');

INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3287', '
Design and Analysis of Database Systems', 'MWF', 660, 735, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3287', '
Design and Analysis of Database Systems', 'MWF', 1020, 1095, 200, 'SP25');

INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3302', '
Introduction to Robotics', 'MWF', 930, 1005, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3593', 'Computer Organization', 'MWF', 970, 1020, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3656', 'Numerical Computation', 'MWF', 675, 725, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3702', '
Cognitive Science', 'TTh', 750, 825, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3753', 'Design and Analysis of Operating Systems', 'TTh', 660, 735, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 3832', 'Natural Language Processing', 'MWF', 545, 559530, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 4022', 'Advanced Data Science', 'MWF', 480, 530, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 4113', 'Linux System Administration', 'MWF', 750, 825, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 4200', '
Introduction to Wireless Systems', 'MWF', 750, 825, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 4239', 'Advanced Computer Graphics', 'TTH', 930, 1005, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 4240', 'Introduction to Blockchain', 'T', 1020, 1170, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 4273', 'Network Systems', 'TTh', 840, 915, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 4302', '
Advanced Robotics', 'MWF', 545, 595, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 4444', 'Algorithms and Data Structures for Analyzing DNA', 'TTh', 690, 765, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 4446', 'Chaotic Dynamics', 'TTh', 570, 645, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 4448', 'Object-Oriented Analysis and Design', 'MWF', 610, 660, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 4555', 'Compiler Construction', 'TTh', 840, 915, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 4622', 'Machine Learning', 'MWF', 805, 855, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 4722', '
Computer Vision', 'MWF', 675, 725, 100, 'SP25');
INSERT into class (class_code, name, days, start_time, stop_time, section, semester) VALUES ('CSCI 4809', 'Computer Animation', 'Th', 1020, 1170, 100, 'SP25');
