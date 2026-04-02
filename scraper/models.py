from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class CandidateData(BaseModel):
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = "Not Specified"
    party: str
    constituency: str
    election_year: str
    result: str  # Won/Lost
    votes_received: int = 0
    total_votes: int = 0
    vote_percentage: float = 0.0
    winning_margin: int = 0
    education: Optional[str] = None
    profession: Optional[str] = None
    total_assets: int = 0
    total_liabilities: int = 0
    criminal_cases_count: int = 0
    affidavit_link: Optional[str] = None
    source_url: str
    profile_pic: Optional[str] = None
    election_type: str = "Assembly"
    candidacy_type: str = "General"
    election_date: Optional[str] = None
    other_elections_summary: Optional[List] = None
    group_id: Optional[str] = None
    scraped_timestamp: datetime = Field(default_factory=datetime.now)

    @validator("age", "total_assets", "total_liabilities", "votes_received", "total_votes", "winning_margin", "criminal_cases_count", pre=True)
    def clean_integer(cls, v):
        if isinstance(v, str):
            import re
            # Remove everything except digits
            v = re.sub(r'[^\d]', '', v)
            return int(v) if v else 0
        return v or 0

    @validator("vote_percentage", pre=True)
    def clean_float(cls, v):
        if isinstance(v, str):
            import re
            # Extract float value
            match = re.search(r'(\d+\.?\d*)', v)
            return float(match.group(1)) if match else 0.0
        return v or 0.0

class CandidateDB(Base):
    __tablename__ = 'candidates'

    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(255), nullable=False)
    age = Column(Integer)
    gender = Column(String(50))
    party = Column(String(255))
    constituency = Column(String(255))
    election_year = Column(String(50))
    result = Column(String(50))
    votes_received = Column(Integer)
    total_votes = Column(Integer)
    vote_percentage = Column(Float)
    winning_margin = Column(Integer)
    education = Column(String(255))
    profession = Column(Text)
    total_assets = Column(Integer)
    total_liabilities = Column(Integer)
    criminal_cases_count = Column(Integer)
    affidavit_link = Column(Text)
    source_url = Column(Text)
    election_type = Column(String(50), default="Assembly")
    candidacy_type = Column(String(50), default="General")
    election_date = Column(String(50))
    other_elections_summary = Column(JSON, nullable=True) # JSON string
    group_id = Column(String, nullable=True)
    scraped_timestamp = Column(DateTime, default=datetime.now)
