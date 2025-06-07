CREATE TABLE invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR,
  token VARCHAR UNIQUE,
  invitation_type VARCHAR,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by_id INTEGER,
  school_id INTEGER,
  student_id INTEGER NULL,
  relationship_type VARCHAR NULL,
  position VARCHAR NULL,
  department VARCHAR NULL,
  FOREIGN KEY(created_by_id) REFERENCES users(id),
  FOREIGN KEY(school_id) REFERENCES schools(id),
  FOREIGN KEY(student_id) REFERENCES students(id)
);
CREATE INDEX ix_invitations_id ON invitations (id);
CREATE INDEX ix_invitations_email ON invitations (email);
CREATE INDEX ix_invitations_token ON invitations (token); 