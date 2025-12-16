"""
Configuration management for EdThing ingestion service
"""
import os
import json
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class Config:
    def __init__(self):
        # Database
        self.database_url = os.getenv('DATABASE_URL', 'postgresql://edthing:edthing@localhost:5432/edthing')

        # EdStem credentials
        self.ed_api_token = os.getenv('ED_API_TOKEN')
        self.ed_course_id = os.getenv('ED_COURSE_ID')

        # Ingestion settings
        self.sync_interval_minutes = int(os.getenv('SYNC_INTERVAL_MINUTES', '60'))

        # Validate required config
        self._validate()

    def _validate(self):
        """Validate required configuration"""
        required = ['ed_api_token', 'ed_course_id']
        missing = [key for key in required if not getattr(self, key)]

        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

    def get_participation_rules(self, db_connection) -> Dict[str, Any]:
        """Get participation filtering rules from database"""
        try:
            with db_connection.cursor() as cursor:
                cursor.execute("SELECT value FROM site_config WHERE key = 'participation_rules'")
                result = cursor.fetchone()
                if result:
                    return result[0]
                else:
                    # Return default rules
                    return {
                        "keywords": ["Muon", "MuP", "Shampoo", "uP", "participation"],
                        "allowed_categories": ["Participation D"],
                        "tag_mappings": {
                            "Muon": ["Muon", "MUON"],
                            "MuP": ["MuP", "MUP", "μP"],
                            "Shampoo": ["Shampoo", "SHAMPOO"],
                            "uP": ["uP", "UP", "μP"]
                        }
                    }
        except Exception as e:
            logger.warning(f"Failed to load participation rules from DB: {e}")
            return self._get_default_participation_rules()

    def _get_default_participation_rules(self) -> Dict[str, Any]:
        """Default participation rules"""
        return {
            "keywords": ["Muon", "MuP", "Shampoo", "uP", "participation"],
            "allowed_categories": ["Participation D"],
            "tag_mappings": {
                "Muon": ["Muon", "MUON"],
                "MuP": ["MuP", "MUP", "μP"],
                "Shampoo": ["Shampoo", "SHAMPOO"],
                "uP": ["uP", "UP", "μP"]
            }
        }

# Global config instance
config = Config()
