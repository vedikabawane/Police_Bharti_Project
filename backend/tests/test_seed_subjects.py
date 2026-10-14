import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import Subject, Topic
from seed_subjects import SUBJECTS, SeedDataError, seed_subjects_and_topics, validate_seed_database


class SeedSubjectsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.database_uri = (
            f"sqlite:///{(Path(cls.temp_dir.name) / 'subjects.sqlite').as_posix()}"
        )
        with (
            patch.object(Config, "SQLALCHEMY_DATABASE_URI", cls.database_uri),
            patch.object(Config, "ADMIN_BOOTSTRAP_ENABLED", False),
        ):
            cls.app = create_app()
        cls.app.config.update(TESTING=True)
        with cls.app.app_context():
            db.create_all()

    @classmethod
    def tearDownClass(cls):
        with cls.app.app_context():
            db.session.remove()
            db.drop_all()
            for engine in db.engines.values():
                engine.dispose()
        cls.temp_dir.cleanup()

    def setUp(self):
        self.context = self.app.app_context()
        self.context.push()
        db.session.remove()
        db.drop_all()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def test_seed_creates_nine_subjects_and_ninety_associated_topics(self):
        result = seed_subjects_and_topics(db.session)

        self.assertEqual(result["created_subjects"], 9)
        self.assertEqual(result["created_topics"], 90)
        self.assertEqual(Subject.query.count(), 9)
        self.assertEqual(Topic.query.count(), 90)

        for subject_name, subject_data in SUBJECTS.items():
            subject = Subject.query.filter_by(name=subject_name).one()
            self.assertEqual(
                {topic.name for topic in subject.topics},
                set(subject_data["topics"]),
            )
            self.assertEqual(len(subject.topics), 10)
            self.assertTrue(all(topic.subject_id == subject.id for topic in subject.topics))

    def test_repeat_seed_creates_no_duplicates_and_preserves_existing_values(self):
        seed_subjects_and_topics(db.session)
        marathi = Subject.query.filter_by(name="Marathi").one()
        marathi.description = "Existing description"
        marathi.is_active = False
        first_topic = marathi.topics[0]
        first_topic.description = "Existing topic description"
        first_topic.is_active = False
        db.session.commit()

        result = seed_subjects_and_topics(db.session)

        self.assertEqual(result["created_subjects"], 0)
        self.assertEqual(result["created_topics"], 0)
        self.assertEqual(result["reused_subjects"], 9)
        self.assertEqual(result["reused_topics"], 90)
        self.assertEqual(Subject.query.count(), 9)
        self.assertEqual(Topic.query.count(), 90)
        self.assertEqual(marathi.description, "Existing description")
        self.assertFalse(marathi.is_active)
        self.assertEqual(first_topic.description, "Existing topic description")
        self.assertFalse(first_topic.is_active)

    def test_existing_unexpected_data_is_not_deleted_or_partially_seeded(self):
        unrelated = Subject(name="Existing subject", description="Preserve")
        db.session.add(unrelated)
        db.session.commit()

        with self.assertRaisesRegex(SeedDataError, "Unexpected subjects"):
            seed_subjects_and_topics(db.session)

        db.session.rollback()
        self.assertEqual(Subject.query.count(), 1)
        self.assertEqual(Topic.query.count(), 0)
        self.assertEqual(unrelated.description, "Preserve")

    def test_seeder_rejects_nonlocal_and_non_development_targets(self):
        unsafe_configs = (
            {
                "APP_ENV": "production",
                "ADMIN_BOOTSTRAP_ENABLED": False,
                "SQLALCHEMY_DATABASE_URI": self.database_uri,
            },
            {
                "APP_ENV": "development",
                "ADMIN_BOOTSTRAP_ENABLED": False,
                "SQLALCHEMY_DATABASE_URI": (
                    "mysql+pymysql://user:password@remote.example/production"
                ),
            },
            {
                "APP_ENV": "development",
                "ADMIN_BOOTSTRAP_ENABLED": True,
                "SQLALCHEMY_DATABASE_URI": (
                    "mysql+pymysql://user:password@localhost/police_bharti_db"
                ),
            },
        )
        for config in unsafe_configs:
            with self.subTest(environment=config["APP_ENV"]):
                with self.assertRaises(SeedDataError):
                    validate_seed_database(config)


if __name__ == "__main__":
    unittest.main()
