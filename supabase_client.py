"""
Supabase PostgreSQL Client Integration
Fetches feature definitions, mutation links, and placement selectors (Table 5).
"""

import os
from typing import List, Optional
from datetime import date, datetime
from dataclasses import dataclass
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@dataclass
class FeatureDefinitionRecord:
    feature_id: str
    name: str
    placement: str
    intro_date: date
    explanation: str
    replaces_feature_id: Optional[str]
    user_facing: bool

class SupabaseFeatureClient:
    def __init__(self, url: Optional[str] = None, service_key: Optional[str] = None):
        self.url = url or os.getenv("SUPABASE_URL", "").strip()
        self.service_key = service_key or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        
        if not self.url or not self.service_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.")
        
        self.client: Client = create_client(self.url, self.service_key)

    def get_all_features(self, user_facing_only: bool = True) -> List[FeatureDefinitionRecord]:
        """Fetch all feature definitions from Supabase, optionally filtering by user_facing."""
        query = self.client.table("feature_definitions").select("*")
        if user_facing_only:
            query = query.eq("user_facing", True)
        
        response = query.order("intro_date", desc=False).execute()
        records = []
        for row in response.data:
            intro_d = datetime.strptime(row["intro_date"], "%Y-%m-%d").date() if isinstance(row["intro_date"], str) else row["intro_date"]
            records.append(FeatureDefinitionRecord(
                feature_id=row["feature_id"],
                name=row["name"],
                placement=row["placement"],
                intro_date=intro_d,
                explanation=row["explanation"],
                replaces_feature_id=row.get("replaces_feature_id"),
                user_facing=row.get("user_facing", True)
            ))
        return records

    def get_mutations_map(self) -> dict:
        """Returns a mapping of replaces_feature_id -> current mutating feature record."""
        features = self.get_all_features(user_facing_only=True)
        return {f.replaces_feature_id: f for f in features if f.replaces_feature_id}
