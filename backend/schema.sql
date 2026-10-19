PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  venue TEXT NOT NULL,
  event_date TEXT NOT NULL,
  organizer TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Ongoing', 'Completed', 'Cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO notices (event_title, category, description, venue, event_date, organizer, status)
SELECT 'ICT Career and Innovation Expo', 'Academic', 'Meet technology employers, explore career paths and see student projects.', 'Engineering Block, Main Hall', '2026-11-05', 'Computer Science Department', 'Upcoming'
WHERE NOT EXISTS (SELECT 1 FROM notices);
INSERT INTO notices (event_title, category, description, venue, event_date, organizer, status)
SELECT 'Freshers Welcome Social', 'Social', 'A welcoming evening for new and returning students with music and games.', 'Student Centre Courtyard', '2026-10-24', 'Student Union', 'Upcoming'
WHERE (SELECT COUNT(*) FROM notices) = 1;
INSERT INTO notices (event_title, category, description, venue, event_date, organizer, status)
SELECT 'Campus Clean-Up Day', 'Community', 'Volunteer to help clean shared campus spaces and plant new flowers.', 'Main Campus Assembly Point', '2026-10-28', 'Environmental Club', 'Upcoming'
WHERE (SELECT COUNT(*) FROM notices) = 2;
INSERT INTO notices (event_title, category, description, venue, event_date, organizer, status)
SELECT 'Interfaculty Football Final', 'Sports', 'Come support the finalist teams in the interfaculty championship.', 'University Sports Grounds', '2026-11-01', 'Sports Council', 'Upcoming'
WHERE (SELECT COUNT(*) FROM notices) = 3;
INSERT INTO notices (event_title, category, description, venue, event_date, organizer, status)
SELECT 'Research Writing Workshop', 'Academic', 'A practical session on research structure, citations and academic integrity.', 'Library Seminar Room', '2026-10-30', 'University Library', 'Upcoming'
WHERE (SELECT COUNT(*) FROM notices) = 4;
INSERT INTO notices (event_title, category, description, venue, event_date, organizer, status)
SELECT 'Blood Donation Drive', 'Community', 'Support the local blood bank through a voluntary campus donation drive.', 'Campus Clinic', '2026-11-08', 'Campus Health Services', 'Upcoming'
WHERE (SELECT COUNT(*) FROM notices) = 5;
INSERT INTO notices (event_title, category, description, venue, event_date, organizer, status)
SELECT 'Entrepreneurship Pitch Night', 'Career', 'Student teams pitch business ideas to a panel of local entrepreneurs.', 'Innovation Hub', '2026-11-12', 'Entrepreneurship Club', 'Upcoming'
WHERE (SELECT COUNT(*) FROM notices) = 6;
INSERT INTO notices (event_title, category, description, venue, event_date, organizer, status)
SELECT 'Mental Wellness Talk', 'Wellbeing', 'An open discussion about student wellbeing, balance and available support.', 'Lecture Theatre B', '2026-10-26', 'Student Counselling Unit', 'Upcoming'
WHERE (SELECT COUNT(*) FROM notices) = 7;
INSERT INTO notices (event_title, category, description, venue, event_date, organizer, status)
SELECT 'Library Orientation', 'Academic', 'Learn how to access library resources, databases and study spaces.', 'University Library', '2026-10-16', 'University Library', 'Completed'
WHERE (SELECT COUNT(*) FROM notices) = 8;
INSERT INTO notices (event_title, category, description, venue, event_date, organizer, status)
SELECT 'Cultural Heritage Evening', 'Social', 'Celebrate local culture with performances, food and student exhibitions.', 'Open Air Theatre', '2026-11-15', 'Cultural Society', 'Upcoming'
WHERE (SELECT COUNT(*) FROM notices) = 9;
