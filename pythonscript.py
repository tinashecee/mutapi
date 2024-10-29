import sqlite3

def create_table(db_file):
  """Creates a table for storing audio recordings in a SQLite database.

  Args:
    db_file: The path to the SQLite database file.
  """

  try:
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    cursor.execute('''
    ALTER TABLE case_recordings ADD COLUMN notes TEXT;
    ''')

    conn.commit()
    conn.close()

    print("Table created successfully!")

  except sqlite3.Error as e:
    print(f"Error creating table: {e}")

if __name__ == "__main__":
  db_file = "MutapiAudioRecordings.db"  # Replace with your database file path
  create_table(db_file)
