from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Define Base class to be used by all models
Base = declarative_base()

# Create tables function
def create_tables(engine):
    Base.metadata.create_all(bind=engine) 